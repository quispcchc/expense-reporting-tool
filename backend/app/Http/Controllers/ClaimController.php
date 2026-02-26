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
    private const NA = 'N/A';

    protected $claimService;

    /**
     * Convert null or empty string to N/A.
     * Numeric zero (0, 0.0) is kept as-is since it's a valid value.
     */
    private static function na(mixed $value): mixed
    {
        if ($value === null || $value === '') {
            return self::NA;
        }

        return $value;
    }

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
            'expenses' => 'nullable|array',
            'expenses.*.transaction_date' => 'required_with:expenses|date',
            'expenses.*.account_number_id' => 'required_with:expenses|integer|exists:account_numbers,account_number_id',
            'expenses.*.buyer_name' => 'required_with:expenses|string',
            'expenses.*.vendor_name' => 'required_with:expenses|string',
            'expenses.*.transaction_desc' => 'nullable|string',
            'expenses.*.transaction_notes' => 'nullable|string',
            'expenses.*.expense_amount' => 'required_with:expenses|numeric',
            'expenses.*.project_id' => 'required_with:expenses|integer|exists:projects,project_id',
            'expenses.*.file.*' => 'file|mimes:pdf,png,jpg,jpeg|max:20480',
            'expenses.*.cost_centre_id' => 'required_with:expenses|integer',
            'expenses.*.tags' => 'nullable|array',
            'expenses.*.tags.*' => 'integer|exists:tags,tag_id',

            // mileage validation (nested per expense — mileage belongs to an expense)
            'expenses.*.mileage' => 'nullable|array',
            'expenses.*.mileage.period_of_from' => 'nullable|date',
            'expenses.*.mileage.period_of_to' => 'nullable|date',
            'expenses.*.mileage.transactions' => 'nullable|array',
            'expenses.*.mileage.transactions.*.transaction_date' => 'required|date',
            'expenses.*.mileage.transactions.*.distance_km' => 'required|numeric|min:0',
            'expenses.*.mileage.transactions.*.meter_km' => 'nullable|numeric',
            'expenses.*.mileage.transactions.*.parking_amount' => 'nullable|numeric',
            'expenses.*.mileage.transactions.*.buyer' => 'nullable|string',
            'expenses.*.mileage.transactions.*.travel_from' => 'nullable|string|max:255',
            'expenses.*.mileage.transactions.*.travel_to' => 'nullable|string|max:255',
            'expenses.*.mileage.transactions.*.file.*' => 'file|mimes:pdf,png,jpg,jpeg|max:20480',
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
        $this->claimService->bulkApproveClaim($claimIds, $user);
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

            $this->claimService->bulkRejectClaim($claimIds, $user);
        }
    }

    /**
     * Export filtered claims as CSV (one row per expense line).
     */
    public function exportCsv(Request $request)
    {
        try {
            $filters = $request->only([
                'date_from', 'date_to',
                'claim_type_id', 'claim_status_id',
                'department_id', 'team_id',
                'project_id', 'cost_centre_id',
                'submitter', 'tag_ids',
                'amount_min', 'amount_max',
            ]);

            $claims = $this->claimService->getFilteredClaimsForExport($filters);

            // Build filename reflecting date filters
            $from = $filters['date_from'] ?? 'all';
            $to   = $filters['date_to']   ?? now()->format('Y-m-d');
            $timestamp = now()->timestamp;
            $filename = "claims_export_{$timestamp}.csv";

            $headers = [
                'Content-Type'        => 'text/csv; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
                'Cache-Control'       => 'no-cache, no-store, must-revalidate',
                'Pragma'              => 'no-cache',
                'Expires'             => '0',
            ];

            $csvColumns = [
                'Claim ID', 'Claim Date', 'Claim Type', 'Claim Status', 'Claim Total',
                'Submitter', 'Department', 'Team', 'Position',
                'Expense ID', 'Buyer Name', 'Vendor Name', 'Transaction Date',
                'Expense Amount', 'Description', 'Notes', 'Expense Status',
                'Project', 'Cost Centre', 'Account Number', 'Tags', 'Claim Notes',
                'Travel From', 'Travel To', 'Distance (km)', 'Mileage Rate',
                'Parking Amount', 'Meter (km)', 'Mileage Total',
            ];

            $callback = function () use ($claims, $csvColumns) {
                // Add UTF-8 BOM for Excel compatibility
                $handle = fopen('php://output', 'w');
                fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));
                fputcsv($handle, $csvColumns);

                foreach ($claims as $claim) {
                    $claimNotes = $claim->notes
                        ->map(fn ($n) => $n->claim_note_text)
                        ->implode(' | ');

                    $submitter = trim(($claim->user->first_name ?? '') . ' ' . ($claim->user->last_name ?? ''));

                    $claimBase = [
                        self::na($claim->claim_id),
                        self::na($claim->claim_submitted),
                        self::na($claim->claimType->claim_type_name),
                        self::na($claim->status->claim_status_name),
                        self::na($claim->total_amount),
                        self::na($submitter),
                        self::na($claim->department->department_name),
                        self::na($claim->team->team_name),
                        self::na($claim->position->position_name),
                    ];

                    if ($claim->expenses->isEmpty()) {
                        // Output claim-level row even if no expenses
                        fputcsv($handle, array_merge($claimBase, array_fill(0, 20, self::NA)));
                        continue;
                    }

                    foreach ($claim->expenses as $expense) {
                        $tags = $expense->tags
                            ->pluck('tag_name')
                            ->implode(', ');

                        $expenseBase = [
                            self::na($expense->expense_id),
                            self::na($expense->buyer_name),
                            self::na($expense->vendor_name),
                            self::na($expense->transaction_date),
                            self::na($expense->expense_amount),
                            self::na($expense->transaction_desc),
                            self::na($expense->transaction_notes),
                            self::na($expense->approvalStatus->approval_status_name),
                            self::na($expense->project->project_name),
                            self::na($expense->costCentre->cost_centre_code),
                            self::na($expense->accountNumber->account_number),
                            self::na($tags),
                            self::na($claimNotes),
                        ];

                        $mileage = $expense->mileage;
                        $mileageTransactions = $mileage?->transactions;

                        if ($mileageTransactions && $mileageTransactions->isNotEmpty()) {
                            foreach ($mileageTransactions as $mt) {
                                fputcsv($handle, array_merge($claimBase, $expenseBase, [
                                    self::na($mt->travel_from),
                                    self::na($mt->travel_to),
                                    self::na($mt->distance_km),
                                    self::na($mt->mileage_rate),
                                    self::na($mt->parking_amount),
                                    self::na($mt->meter_km),
                                    self::na($mt->total_amount),
                                ]));
                            }
                        } else {
                            fputcsv($handle, array_merge($claimBase, $expenseBase, array_fill(0, 7, self::NA)));
                        }
                    }
                }

                fclose($handle);
            };

            return response()->stream($callback, 200, $headers);
        } catch (Throwable $e) {
            Log::error('CSV Export Error: ' . $e->getMessage());

            return $this->errorResponse('Failed to export CSV: ' . $e->getMessage(), 500);
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
                'expenses.mileage.transactions.receipts',
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

            // Render receipt attachments on a new page (images + PDFs)
            $tempFiles = $this->renderAttachments($mpdf, $claim);

            \Log::info('PDF generated successfully for Claim: '.$claimId);

            // Generate filename
            $filename = 'claim_'.$claimId.'_'.now()->format('Y-m-d').'.pdf';

            // Get PDF content as string
            $pdfContent = $mpdf->Output($filename, \Mpdf\Output\Destination::STRING_RETURN);
            $contentLength = strlen($pdfContent);

            // Clean up temp Ghostscript images after PDF is rendered
            foreach ($tempFiles as $tmp) {
                if (file_exists($tmp)) {
                    @unlink($tmp);
                }
            }

            \Log::info('PDF content length: '.$contentLength.' bytes for Claim: '.$claimId);

            // Clean any output buffers to prevent interference
            while (ob_get_level() > 0) {
                ob_end_clean();
            }

            // Return PDF as download with explicit Content-Length
            return response($pdfContent)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Length', $contentLength)
                ->header('Content-Disposition', 'attachment; filename="'.$filename.'"')
                ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
                ->header('Pragma', 'no-cache')
                ->header('Expires', '0');
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
                    'expenses.mileage.transactions.receipts',
                    'notes.user',
                ])->find($claimId);

                if ($claim) {
                    // Create mPDF instance with CJK font support
                    $mpdf = $this->createMpdfInstance();

                    // Render blade template to HTML
                    $html = view('pdf.claim', ['claim' => $claim])->render();

                    // Write HTML to PDF
                    $mpdf->WriteHTML($html);

                    // Render receipt attachments on a new page (images + PDFs)
                    $tempFiles = $this->renderAttachments($mpdf, $claim);

                    $filename = 'claim_'.$claimId.'.pdf';
                    $filepath = $tempDir.'/'.$filename;
                    $mpdf->Output($filepath, \Mpdf\Output\Destination::FILE);

                    // Clean up temp Ghostscript images after PDF is rendered
                    foreach ($tempFiles as $tmp) {
                        if (file_exists($tmp)) {
                            @unlink($tmp);
                        }
                    }
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
     * Render all receipt attachments (images + PDFs) on a new page.
     *
     * PDF files are converted to PNG via Ghostscript so they display
     * inline with the same format as image receipts.
     *
     * Returns an array of temp file paths to clean up AFTER $mpdf->Output().
     */
    private function renderAttachments(Mpdf $mpdf, Claim $claim): array
    {
        $receipts = [];

        foreach ($claim->expenses ?? [] as $expense) {
            $label = 'Expense #'.($expense->expense_id ?? 'N/A')
                .' - '.($expense->vendor_name ?? 'N/A');

            foreach ($expense->receipts ?? [] as $receipt) {
                if ($receipt->receipt_path) {
                    $receipts[] = ['path' => $receipt->receipt_path, 'label' => $label];
                }
            }

            if ($expense->mileage && $expense->mileage->transactions) {
                foreach ($expense->mileage->transactions as $mt) {
                    $mLabel = 'Mileage - Expense #'.($expense->expense_id ?? 'N/A')
                        .' ('.($mt->travel_from ?? 'N/A').' → '.($mt->travel_to ?? 'N/A').')';

                    foreach ($mt->receipts ?? [] as $mReceipt) {
                        if ($mReceipt->file_path) {
                            $receipts[] = ['path' => $mReceipt->file_path, 'label' => $mLabel];
                        }
                    }
                }
            }
        }

        if (empty($receipts)) {
            return [];
        }

        // Start attachments on a new page
        $mpdf->AddPage();
        $mpdf->WriteHTML(
            '<div style="font-size:12px; font-weight:bold; border-bottom:1px solid #333; '
            .'padding:8px 0 5px 0; margin-bottom:8px;">ATTACHMENT(S)</div>'
        );

        $tempFiles = [];

        foreach ($receipts as $receipt) {
            $filePath = storage_path('app/public/'.$receipt['path']);
            $safeLabel = htmlspecialchars($receipt['label']);

            if (! file_exists($filePath) || ! is_file($filePath)) {
                $mpdf->WriteHTML(
                    '<div style="text-align:center; margin:10px 0;">'
                    .'<div style="font-size:9px; font-weight:bold; margin-bottom:5px; color:#666;">'
                    .$safeLabel.'</div>'
                    .'<p style="color:#999; font-size:9px;">Receipt file not found</p></div>'
                );

                continue;
            }

            $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
            \Log::info('Rendering attachment: '.$filePath.' | ext: '.$ext.' | exists: '.(file_exists($filePath) ? 'YES' : 'NO'));

            if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif'])) {
                // Image — embed directly
                $mpdf->WriteHTML(
                    '<div style="text-align:center; margin:10px 0;">'
                    .'<div style="font-size:9px; font-weight:bold; margin-bottom:5px; color:#666;">'
                    .$safeLabel.'</div>'
                    .'<img src="'.$filePath.'" style="max-width:300px; max-height:400px; '
                    .'margin:10px auto; border:1px solid #ddd; padding:5px; display:block;">'
                    .'</div>'
                );
            } elseif ($ext === 'pdf') {
                // PDF — convert each page to PNG via Ghostscript, then embed like images
                $images = $this->convertPdfToImages($filePath);
                $tempFiles = array_merge($tempFiles, $images);
                $pageCount = count($images);

                if ($pageCount === 0) {
                    $mpdf->WriteHTML(
                        '<div style="text-align:center; margin:10px 0;">'
                        .'<div style="font-size:9px; font-weight:bold; margin-bottom:5px; color:#666;">'
                        .$safeLabel.'</div>'
                        .'<p style="color:#999; font-size:9px;">Could not render PDF</p></div>'
                    );

                    continue;
                }

                foreach ($images as $idx => $imgPath) {
                    $pageLabel = $pageCount > 1
                        ? $safeLabel.' (page '.($idx + 1).' of '.$pageCount.')'
                        : $safeLabel;

                    $mpdf->WriteHTML(
                        '<div style="text-align:center; margin:10px 0;">'
                        .'<div style="font-size:9px; font-weight:bold; margin-bottom:5px; color:#666;">'
                        .$pageLabel.'</div>'
                        .'<img src="'.$imgPath.'" style="max-width:300px; max-height:400px; '
                        .'margin:10px auto; border:1px solid #ddd; padding:5px; display:block;">'
                        .'</div>'
                    );
                }
            }
        }

        // Return temp files — caller must clean up AFTER $mpdf->Output()
        return $tempFiles;
    }

    /**
     * Convert a PDF file to PNG images using Ghostscript CLI.
     *
     * Returns an array of temporary PNG file paths (one per page).
     */
    private function convertPdfToImages(string $pdfPath): array
    {
        $outputPattern = storage_path('app/temp_gs_'.uniqid().'_%03d.png');

        $command = sprintf(
            'gs -dNOPAUSE -dBATCH -dSAFER -sDEVICE=png16m -r150 '
            .'-dTextAlphaBits=4 -dGraphicsAlphaBits=4 '
            .'-sOutputFile=%s %s 2>&1',
            escapeshellarg($outputPattern),
            escapeshellarg($pdfPath)
        );

        \Log::info('Ghostscript command: '.$command);
        exec($command, $output, $exitCode);
        \Log::info('Ghostscript exit code: '.$exitCode.' | output: '.implode("\n", $output));

        if ($exitCode !== 0) {
            \Log::warning('Ghostscript conversion failed for '.$pdfPath.': '.implode("\n", $output));

            return [];
        }

        // Ghostscript %03d starts at 001
        $images = [];
        $page = 1;

        while (file_exists($path = sprintf($outputPattern, $page))) {
            $images[] = $path;
            $page++;
        }

        return $images;
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
