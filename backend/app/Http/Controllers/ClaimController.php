<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClaimRequest;
use App\Http\Resources\ClaimResource;
use App\Models\Claim;
use App\Services\ClaimService;
use Illuminate\Http\Request;
use Log;
use Throwable;
use function Symfony\Component\String\s;
use Barryvdh\DomPDF\Facade\Pdf;


class ClaimController extends Controller
{

    protected $claimService;

    public function __construct(ClaimService $claimService)
    {
        $this->claimService = $claimService;
    }

    /**
     * Get a single claim
     */
    public function show($claimId)
    {
        $claim = $this->claimService->getClaimById($claimId);

        return response()->json($claim);
    }

    /**
     * Get all claims according to role level
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $claims = $this->claimService->getAllClaims($user);

        return response()->json($claims);
    }

    public function getClaimsByUser(Request $request) {

        $user = $request->user();

        $myClaims = $this->claimService->getClaimsByUserId($user);

        return response()->json($myClaims);
    }


    /**
     * Store a new claim with optional expenses and mileage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            // claim form validation
            'position_id' => 'required|integer|exists:positions,position_id',
            'claim_type_id' => 'required|integer|exists:claim_types,claim_type_id',
            'department_id' => 'required|integer|exists:departments,department_id',
            'team_id' => 'required|integer|exists:teams,team_id',
            'claim_notes' => 'nullable|string',
            'total_amount' => 'required|numeric|min:2',

            // expense item validation
            'expenses' => 'required|array',
            'expenses.*.transaction_date' => 'required_with:expenses|date',
            'expenses.*.account_number_id' => 'required_with:expense|integer|exists:account_numbers,account_number_id',
            'expenses.*.buyer_name' => 'required_with:expenses|string',
            'expenses.*.vendor_name' => 'required_with:expenses|string',
            'expenses.*.transaction_desc' => 'nullable|string',
            'expenses.*.transaction_notes' => 'nullable|string',
            'expenses.*.expense_amount' => 'required_with:expenses|integer',
            'expenses.*.project_id' => 'required_with:expenses|integer|exists:projects,project_id',
            'expenses.*.file.*' => 'file|mimes:pdf,png,jpg,jpeg|max:20480',
            'expenses.*.cost_centre_id' => 'required_with:expenses|integer',
            'expenses.*.tags' => 'nullable|string',
            'mileage' => 'nullable|array',
        ]);

        try {
            Log::info('Incoming claim create request', [
                'user_id' => $request->user()?->user_id,
                'payload' => $validated,
            ]);

            $claim = $this->claimService->createClaim($validated, $request->user());

            return response()->json([
                'message' => 'Claim submitted successfully',
                'claim' => $claim
            ], 201);

        } catch (Throwable $e) {
            Log::error('Claim create failed', [
                'user_id' => $request->user()?->user_id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request,$id) {
        $validated = $request->validate([
            'claim_type_id' => 'required|exists:claim_types,claim_type_id',
            'team_id' => 'required|exists:teams,team_id',
        ]);

        $this->claimService->updateClaim($validated,$id);
    }


    public function bulkApproveClaim(Request $request)
    {
        $user = $request->user();
        $claimIds = $request->claimIds;

        $claims = Claim::whereIn('claim_id', $claimIds)->get();

        foreach ($claims as $claim) {
            if ($user->cannot('approve', $claim)) {
                return response()->json([
                    'message' => "Not authorized to approve claim ID {$claim->claim_id}."
                ], 403);
            }
        }
        $this->claimService->bulkApproveClaim($claimIds);
    }

    public function bulkRejectClaim(Request $request)
    {
        $user = $request->user();
        $claimIds = $request->claimIds;

        $claims = Claim::whereIn('claim_id', $claimIds)->get();

        foreach ($claims as $claim) {
            if ($user->cannot('reject', $claim)) {
                return response()->json([
                    'message' => "Not authorized to reject claim ID {$claim->claim_id}."
                ], 403);
            }

            $this->claimService->bulkRejectClaim($claimIds);
        }
    }

    /**
     * Export claim as PDF with all expenses and receipts
     */
    public function exportPdf($claimId)
    {
        try {
            \Log::info('PDF Export Started for Claim: ' . $claimId);
            
            // Set mbstring encoding for proper UTF-8 handling
            mb_internal_encoding('UTF-8');
            mb_http_output('UTF-8');
            mb_regex_encoding('UTF-8');
            
            // Load claim with all necessary relationships
            $claim = Claim::with([
                'claimType',
                'user.position',
                'user.department',
                'user.team',
                'expenses.accountNumber',
                'expenses.costCentre',
                'expenses.approvalStatus',
                'expenses.receipts',
                'notes.user'
            ])->findOrFail($claimId);

            \Log::info('Claim loaded. Expenses count: ' . count($claim->expenses ?? []));
            
            // Log receipt files
            foreach ($claim->expenses ?? [] as $expense) {
                foreach ($expense->receipts ?? [] as $receipt) {
                    $imagePath = storage_path('app/public/' . $receipt->receipt_path);
                    \Log::info('Receipt path: ' . $receipt->receipt_path . ' | Full path: ' . $imagePath . ' | Exists: ' . (file_exists($imagePath) ? 'YES' : 'NO'));
                }
            }

            // Generate PDF from blade template
            $pdf = Pdf::loadView('pdf.claim', ['claim' => $claim])
                ->setPaper('a4', 'portrait')
                ->setOption('isHtml5ParserEnabled', true)
                ->setOption('isRemoteEnabled', true)
                ->setOption('chroot', storage_path('app/public'))
                ->setOption('enable_php', false)
                ->setOption('enable_javascript', false)
                ->setOption('debugKeepTemp', false)
                ->setOption('isUnicode', true)
                ->setOption('isFontSubsettingEnabled', true);

            \Log::info('PDF generated successfully for Claim: ' . $claimId);
            
            // Download PDF with claim ID in filename
            return $pdf->download('claim_' . $claimId . '_' . now()->format('Y-m-d') . '.pdf');
        } catch (\Exception $e) {
            \Log::error('PDF Export Error for Claim ' . $claimId . ': ' . $e->getMessage() . ' | Stack: ' . $e->getTraceAsString());
            return response()->json(['error' => 'Failed to generate PDF: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Export multiple claims as a single ZIP file
     */
    public function exportMultiplePdf(Request $request)
    {
        $claimIds = $request->input('claimIds', []);
        
        if (empty($claimIds)) {
            return response()->json(['error' => 'No claim IDs provided'], 400);
        }

        // Create temporary directory for PDFs
        $tempDir = storage_path('app/temp_pdfs_' . uniqid());
        if (!file_exists($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $pdfFiles = [];

        try {
            // Generate PDF for each claim
            foreach ($claimIds as $claimId) {
                $claim = Claim::with([
                    'claimType',
                    'user.position',
                    'user.department',
                    'user.team',
                    'expenses.accountNumber',
                    'expenses.costCentre',
                    'expenses.approvalStatus',
                    'expenses.receipts',
                    'notes.user'
                ])->find($claimId);

                if ($claim) {
                    $pdf = Pdf::loadView('pdf.claim', ['claim' => $claim])
                        ->setPaper('a4', 'portrait')
                        ->setOption('isHtml5ParserEnabled', true)
                        ->setOption('isRemoteEnabled', true)
                        ->setOption('chroot', storage_path('app/public'))
                        ->setOption('enable_php', false)
                        ->setOption('enable_javascript', false)
                        ->setOption('debugKeepTemp', false)
                        ->setOption('isUnicode', true)
                        ->setOption('isFontSubsettingEnabled', true);

                    $filename = 'claim_' . $claimId . '.pdf';
                    $filepath = $tempDir . '/' . $filename;
                    $pdf->save($filepath);
                    $pdfFiles[] = $filepath;
                }
            }

            // Create ZIP file
            $zipFilename = 'claims_export_' . now()->format('Y-m-d_His') . '.zip';
            $zipPath = storage_path('app/' . $zipFilename);

            $zip = new \ZipArchive();
            if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === true) {
                foreach ($pdfFiles as $file) {
                    $zip->addFile($file, basename($file));
                }
                $zip->close();
            }

            // Clean up temporary PDF files
            foreach ($pdfFiles as $file) {
                if (file_exists($file)) {
                    unlink($file);
                }
            }
            if (file_exists($tempDir)) {
                rmdir($tempDir);
            }

            // Return ZIP file for download and delete after sending
            return response()->download($zipPath, $zipFilename)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            \Log::error('PDF Export (Multiple) Error: ' . $e->getMessage() . ' | Stack: ' . $e->getTraceAsString());
            
            // Clean up on error
            foreach ($pdfFiles as $file) {
                if (file_exists($file)) {
                    unlink($file);
                }
            }
            if (file_exists($tempDir)) {
                rmdir($tempDir);
            }

            return response()->json(['error' => 'Failed to generate ZIP file: ' . $e->getMessage()], 500);
        }
    }

}
