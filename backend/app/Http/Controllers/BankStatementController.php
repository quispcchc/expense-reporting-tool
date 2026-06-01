<?php

namespace App\Http\Controllers;

use App\Services\BankStatementProcessor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class BankStatementController extends Controller
{
    private const VENV_PYTHON = '/opt/pdftools/bin/python3';

    public function extract(Request $request)
    {
        $request->validate([
            'bank_statement' => 'required|file|mimes:'.BankStatementProcessor::ALLOWED_VALIDATION_MIMES.'|max:20480',
        ]);

        $tempPdf = null;

        try {
            $upload = $request->file('bank_statement');

            // Convert non-PDF uploads to a temp PDF before running pdfplumber.
            // Images and (when LibreOffice is available) Word docs are normalised
            // so the extractor always works against a real PDF.
            [$pdfPath, $isTemp] = BankStatementProcessor::ensurePdfFile($upload);
            if ($isTemp) {
                $tempPdf = $pdfPath;
                Log::info('Bank statement converted to PDF for extraction', [
                    'original_name' => $upload->getClientOriginalName(),
                    'temp_pdf' => $pdfPath,
                ]);

                // The converted PDF from an image has no text layer; run OCR
                // so pdfplumber has something to read. --skip-text means a doc
                // converted via LibreOffice (already text-bearing) is a no-op.
                BankStatementProcessor::ocrPdfInPlace($pdfPath);
            }

            $result = $this->extractWithPdfplumber($pdfPath);

            if (! isset($result['error']) && ! empty($result['expenses'])) {
                $refunds = $result['refunds'] ?? [];
                $paired = (int) ($result['paired'] ?? 0);
                Log::info('Bank statement extracted via pdfplumber', [
                    'count' => count($result['expenses']),
                    'refunds_unmatched' => count($refunds),
                    'pairs_cancelled' => $paired,
                ]);

                return $this->successResponse([
                    'expenses' => $result['expenses'],
                    'refunds'  => $refunds,
                    'count'    => count($result['expenses']),
                    'paired'   => $paired,
                ]);
            }

            Log::warning('pdfplumber extraction failed', ['error' => $result['error'] ?? 'no rows returned']);

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
        } finally {
            if ($tempPdf && file_exists($tempPdf)) {
                @unlink($tempPdf);
            }
        }
    }

    private function extractWithPdfplumber(string $pdfPath): array
    {
        $python = $this->findPython();
        if (! $python) {
            return ['error' => 'Python not available'];
        }

        $script = base_path('scripts/extract_bank_statement.py');
        if (! file_exists($script)) {
            return ['error' => 'Extraction script not found'];
        }

        $command = sprintf(
            '%s %s %s 2>/dev/null',
            escapeshellarg($python),
            escapeshellarg($script),
            escapeshellarg($pdfPath)
        );

        $output = shell_exec($command);

        if (empty($output)) {
            return ['error' => 'No output from Python script'];
        }

        $decoded = json_decode($output, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return ['error' => 'Invalid JSON from Python script: '.substr($output, 0, 200)];
        }

        return $decoded;
    }

    private function findPython(): ?string
    {
        if (file_exists(self::VENV_PYTHON) && is_executable(self::VENV_PYTHON)) {
            return self::VENV_PYTHON;
        }

        foreach (['python3', 'python'] as $cmd) {
            exec('which '.escapeshellarg($cmd).' 2>/dev/null', $out, $code);
            if ($code === 0 && ! empty($out[0])) {
                return trim($out[0]);
            }
            $out = [];
        }

        return null;
    }
}
