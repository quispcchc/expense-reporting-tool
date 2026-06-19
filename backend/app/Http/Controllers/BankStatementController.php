<?php

namespace App\Http\Controllers;

use App\Services\BankStatementExtractor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class BankStatementController extends Controller
{
    protected $extractor;

    public function __construct(BankStatementExtractor $extractor)
    {
        $this->extractor = $extractor;
    }

    public function extract(Request $request)
    {
        $request->validate([
            'bank_statement' => 'required|file|mimes:pdf,jpg,jpeg,png,gif,webp,doc,docx|max:20480',
            'claim_type_id' => 'nullable|integer'
        ]);

        try {
            $upload = $request->file('bank_statement');
            $filePath = $upload->getRealPath();
            $mimeType = $upload->getClientMimeType();
            $claimTypeId = $request->input('claim_type_id');

            $result = $this->extractor->extract($filePath, $mimeType, (int)$claimTypeId);

            if (! empty($result['expenses'])) {
                Log::info('Bank statement extracted via PHP service', [
                    'count' => count($result['expenses']),
                    'refunds' => count($result['refunds']),
                    'paired' => $result['paired'],
                ]);

                return $this->successResponse([
                    'expenses' => $result['expenses'],
                    'refunds'  => $result['refunds'],
                    'count'    => count($result['expenses']),
                    'paired'   => $result['paired'],
                    'account_number' => $result['account_number'],
                ]);
            }

            Log::warning('Extraction failed or no expenses found');

            return $this->errorResponse(
                'Could not extract transactions from the uploaded statement. The file will still be saved with the claim.',
                422
            );

        } catch (Throwable $e) {
            Log::error('Bank statement extraction failed', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'Failed to process bank statement: '.$e->getMessage(),
                500
            );
        }
    }
}

