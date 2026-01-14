<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Services\ClaimService;
use Illuminate\Http\Request;
use Log;
use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;
use Mpdf\Mpdf;
use Throwable;

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

        return $this->successResponse($claim);
    }

    /**
     * Get all claims according to role level
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $claims = $this->claimService->getAllClaims($user);

        return $this->successResponse($claims);
    }

    public function getClaimsByUser(Request $request)
    {

        $user = $request->user();

        $myClaims = $this->claimService->getClaimsByUserId($user);

        return $this->successResponse($myClaims);
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

            return $this->successResponse(
                $claim,
                trans('messages.claim_submitted_success'),
                201
            );

        } catch (Throwable $e) {
            Log::error('Claim create failed', [
                'user_id' => $request->user()?->user_id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'claim_type_id' => 'required|exists:claim_types,claim_type_id',
            'team_id' => 'required|exists:teams,team_id',
        ]);

        $this->claimService->updateClaim($validated, $id);
    }

    public function bulkApproveClaim(Request $request)
    {
        $user = $request->user();
        $claimIds = $request->claimIds;

        $claims = Claim::whereIn('claim_id', $claimIds)->get();

        foreach ($claims as $claim) {
            if ($user->cannot('approve', $claim)) {
                return $this->errorResponse(trans('messages.not_authorized_approve', ['id' => $claim->claim_id]), 403);
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
                return $this->errorResponse(trans('messages.not_authorized_reject', ['id' => $claim->claim_id]), 403);
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
            \Log::info('PDF Export Started for Claim: '.$claimId);

            // Set mbstring encoding for proper UTF-8 handling
            mb_internal_encoding('UTF-8');
            mb_http_output('UTF-8');
            mb_regex_encoding('UTF-8');

            // Load claim with all necessary relationships
            $claim = Claim::with([
                'claimType',
                'status',
                'user',
                'department',
                'team',
                'position',
                'expenses.accountNumber',
                'expenses.costCentre',
                'expenses.approvalStatus',
                'expenses.receipts',
                'notes.user',
            ])->findOrFail($claimId);

            \Log::info('Claim loaded. Expenses count: '.count($claim->expenses ?? []));

            // Log receipt files
            foreach ($claim->expenses ?? [] as $expense) {
                foreach ($expense->receipts ?? [] as $receipt) {
                    $imagePath = storage_path('app/public/'.$receipt->receipt_path);
                    \Log::info('Receipt path: '.$receipt->receipt_path.' | Full path: '.$imagePath.' | Exists: '.(file_exists($imagePath) ? 'YES' : 'NO'));
                }
            }

            // Create mPDF instance with CJK font support
            $mpdf = $this->createMpdfInstance();

            // Render blade template to HTML
            $html = view('pdf.claim', ['claim' => $claim])->render();

            // Write HTML to PDF
            $mpdf->WriteHTML($html);

            \Log::info('PDF generated successfully for Claim: '.$claimId);

            // Generate filename
            $filename = 'claim_'.$claimId.'_'.now()->format('Y-m-d').'.pdf';

            // Return PDF as download
            return response($mpdf->Output($filename, \Mpdf\Output\Destination::STRING_RETURN))
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'attachment; filename="'.$filename.'"');
        } catch (\Exception $e) {
            \Log::error('PDF Export Error for Claim '.$claimId.': '.$e->getMessage().' | Stack: '.$e->getTraceAsString());

            return $this->errorResponse('Failed to generate PDF: '.$e->getMessage(), 500);
        }
    }

    /**
     * Export multiple claims as a single ZIP file
     */
    public function exportMultiplePdf(Request $request)
    {
        $claimIds = $request->input('claimIds', []);

        if (empty($claimIds)) {
            return $this->errorResponse('No claim IDs provided', 400);
        }

        // Create temporary directory for PDFs
        $tempDir = storage_path('app/temp_pdfs_'.uniqid());
        if (! file_exists($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $pdfFiles = [];

        try {
            // Generate PDF for each claim
            foreach ($claimIds as $claimId) {
                $claim = Claim::with([
                    'claimType',
                    'status',
                    'user',
                    'department',
                    'team',
                    'position',
                    'expenses.accountNumber',
                    'expenses.costCentre',
                    'expenses.approvalStatus',
                    'expenses.receipts',
                    'notes.user',
                ])->find($claimId);

                if ($claim) {
                    // Create mPDF instance with CJK font support
                    $mpdf = $this->createMpdfInstance();

                    // Render blade template to HTML
                    $html = view('pdf.claim', ['claim' => $claim])->render();

                    // Write HTML to PDF
                    $mpdf->WriteHTML($html);

                    $filename = 'claim_'.$claimId.'.pdf';
                    $filepath = $tempDir.'/'.$filename;
                    $mpdf->Output($filepath, \Mpdf\Output\Destination::FILE);
                    $pdfFiles[] = $filepath;
                }
            }

            // Create ZIP file
            $zipFilename = 'claims_export_'.now()->format('Y-m-d_His').'.zip';
            $zipPath = storage_path('app/'.$zipFilename);

            $zip = new \ZipArchive;
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
            \Log::error('PDF Export (Multiple) Error: '.$e->getMessage().' | Stack: '.$e->getTraceAsString());

            // Clean up on error
            foreach ($pdfFiles as $file) {
                if (file_exists($file)) {
                    unlink($file);
                }
            }
            if (file_exists($tempDir)) {
                rmdir($tempDir);
            }

            return $this->errorResponse('Failed to generate ZIP file: '.$e->getMessage(), 500);
        }
    }

    /**
     * Create mPDF instance with CJK font support
     */
    private function createMpdfInstance(): Mpdf
    {
        // Get default font configuration
        $defaultConfig = (new ConfigVariables)->getDefaults();
        $fontDirs = $defaultConfig['fontDir'];

        $defaultFontConfig = (new FontVariables)->getDefaults();
        $fontData = $defaultFontConfig['fontdata'];

        // Create mPDF temp directory if not exists
        $tempDir = storage_path('app/mpdf');
        if (! file_exists($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        // Add CJK font to font data with TTC configuration
        $customFontData = [
            'notosanscjk' => [
                'R' => 'NotoSansCJK-Regular.ttc',
                'TTCfontID' => [
                    'R' => 3, // Index 3 is Simplified Chinese, 2 is Japanese, 1 is Korean, 0 is Traditional Chinese
                ],
                'useOTL' => 0xFF,
            ],
        ];

        // mPDF configuration with CJK font support
        $mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'orientation' => 'P',
            'tempDir' => $tempDir,
            'fontDir' => array_merge($fontDirs, [
                '/usr/share/fonts/noto-cjk',
            ]),
            'fontdata' => $fontData + $customFontData,
            'default_font' => 'dejavusans', // Use built-in font as default
            'default_font_size' => 11,
            'autoScriptToLang' => true,
            'autoLangToFont' => true,
            // Map CJK scripts to our custom font
            'backupSIPFont' => 'notosanscjk',
        ]);

        return $mpdf;
    }
}
