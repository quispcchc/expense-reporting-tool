<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;
use Smalot\PdfParser\Parser;
use Google\Cloud\Vision\V1\Client\ImageAnnotatorClient;
use Google\Cloud\Vision\V1\AnnotateImageRequest;
use Google\Cloud\Vision\V1\BatchAnnotateImagesRequest;
use Google\Cloud\Vision\V1\AnnotateFileRequest;
use Google\Cloud\Vision\V1\BatchAnnotateFilesRequest;
use Google\Cloud\Vision\V1\InputConfig;
use Google\Cloud\Vision\V1\Feature;
use Google\Cloud\Vision\V1\Feature\Type;
use Google\Cloud\Vision\V1\Image;
use PhpOffice\PhpWord\IOFactory;

class BankStatementExtractor
{
    private $runningBalance = null;
    private const DATE_REGEX = '/\b(\d{1,2}[\/\-\.]\d{1,2}(?:[\/\-\.]\d{2,4})?|\d{4}[\/\-]\d{2}[\/\-]\d{2}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:\s+\d{4})?|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:,?\s+\d{4})?)\b/i';
    private const AMOUNT_REGEX = '/(?<![0-9,.\/])\$?\s*([+-]?\s*(?:\d{1,3}(?:,\d{3})*(?:\.\d{1,3})?|\d+\.\d{1,3}))\s*(DR|CR)?(?![0-9,.\/])/i';
    private const YEAR_REGEX = '/\b(20\d{2})\b/';
    private const ACCOUNT_REGEX = '/(?:Account|Acc|Acct|A\/c)(?:\s*(?:Number|#|No\.?))?\s*[:|-]?\s*([\d-]+)/i';
    
    private const BLACKLIST_KEYWORDS = [
        'BALANCE', 'SUMMARY', 'STATEMENT', 'PAGE', 'DATE', 'DESCRIPTION', 
        'CLOSING', 'OPENING', 'PREVIOUS', 'MINIMUM', 
        'ANNUAL', 'PERCENTAGE', 'BEGAN PROCESSING'
    ];
    
    public function extract(string $filePath, string $mimeType): array
    {
        $text = $this->extractText($filePath, $mimeType);
        if (empty($text)) {
            Log::warning('Extractor: No text extracted from file');
            return ['expenses' => [], 'refunds' => [], 'paired' => 0];
        }

        // Log a sample of the text to help debug extraction issues
        Log::info('[OCR DEBUG] Extracted text sample: ' . substr(str_replace("\n", " | ", $text), 0, 2000));
        
        return $this->parseText($text);
    }

    private function extractText(string $filePath, string $mimeType): string
    {
        try {
            if (str_contains($mimeType, 'pdf')) {
                return $this->extractFromPdf($filePath);
            } elseif (str_contains($mimeType, 'image')) {
                return $this->extractFromImage($filePath);
            } elseif (str_contains($mimeType, 'word') || str_contains($mimeType, 'officedocument')) {
                return $this->extractFromWord($filePath);
            }
        } catch (Exception $e) {
            Log::error('Text extraction failed', ['error' => $e->getMessage()]);
            throw $e;
        }

        return '';
    }

    private function extractFromPdf(string $filePath): string
    {
        try {
            $parser = new Parser();
            $pdf = $parser->parseFile($filePath);
            $text = $pdf->getText();
            
            // If text is very short, it might be an image-based PDF. Try Vision API if available.
            if (strlen(trim($text)) < 50) {
                return $this->extractFromFileViaVision($filePath, 'application/pdf');
            }
            
            return $text;
        } catch (Exception $e) {
            Log::warning('Smalot PDF parser failed, falling back to Vision API', ['error' => $e->getMessage()]);
            return $this->extractFromFileViaVision($filePath, 'application/pdf');
        }
    }

    private function extractFromFileViaVision(string $filePath, string $mimeType): string
    {
        try {
            $imageAnnotator = new ImageAnnotatorClient();
            $content = file_get_contents($filePath);
            
            $inputConfig = new InputConfig();
            $inputConfig->setContent($content);
            $inputConfig->setMimeType($mimeType);
            
            $feature = new Feature();
            $feature->setType(Type::DOCUMENT_TEXT_DETECTION);
            
            $request = new AnnotateFileRequest();
            $request->setInputConfig($inputConfig);
            $request->setFeatures([$feature]);
            
            $batchRequest = new BatchAnnotateFilesRequest();
            $batchRequest->setRequests([$request]);
            
            $response = $imageAnnotator->batchAnnotateFiles($batchRequest);
            $responses = $response->getResponses();
            
            $text = '';
            foreach ($responses as $res) {
                if ($res->getError()) {
                    Log::error('Vision API individual file error', ['error' => $res->getError()->getMessage()]);
                    continue;
                }
                
                $responsesList = $res->getResponses();
                foreach ($responsesList as $pageRes) {
                    $annotation = $pageRes->getFullTextAnnotation();
                    if ($annotation) {
                        $text .= $annotation->getText();
                    }
                }
            }

            $imageAnnotator->close();
            return $text;
        } catch (Exception $e) {
            Log::error('Google Cloud Vision File API failed', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    private function extractFromImage(string $filePath): string
    {
        try {
            $imageAnnotator = new ImageAnnotatorClient();
            $imageContent = file_get_contents($filePath);
            
            $image = new Image();
            $image->setContent($imageContent);
            
            $feature = new Feature();
            $feature->setType(Type::DOCUMENT_TEXT_DETECTION);
            
            $request = new AnnotateImageRequest();
            $request->setImage($image);
            $request->setFeatures([$feature]);
            
            $batchRequest = new BatchAnnotateImagesRequest();
            $batchRequest->setRequests([$request]);
            
            $response = $imageAnnotator->batchAnnotateImages($batchRequest);
            $responses = $response->getResponses();
            
            $text = '';
            foreach ($responses as $res) {
                if ($res->getError()) {
                    Log::error('Vision API individual error', ['error' => $res->getError()->getMessage()]);
                    continue;
                }
                $annotation = $res->getFullTextAnnotation();
                if ($annotation) {
                    $text .= $annotation->getText();
                }
            }

            $imageAnnotator->close();

            return $text;
        } catch (Exception $e) {
            Log::error('Google Cloud Vision API failed', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    private function extractFromWord(string $filePath): string
    {
        try {
            $phpWord = IOFactory::load($filePath);
            $text = '';
            foreach ($phpWord->getSections() as $section) {
                foreach ($section->getElements() as $element) {
                    if (method_exists($element, 'getText')) {
                        $text .= $element->getText() . "\n";
                    }
                }
            }
            return $text;
        } catch (Exception $e) {
            Log::error('PhpWord extraction failed', ['error' => $e->getMessage()]);
            return '';
        }
    }

    private function parseText(string $text): array
    {
        $lines = explode("\n", $text);
        $expenses = [];
        $refunds = [];
        $accountNumber = null;
        $statementYear = $this->extractStatementYear($text);
        $this->runningBalance = null;

        $lastDate = null;
        $lastVendor = null;
        $currentSection = null; // 'debit' or 'credit'

        foreach ($lines as $i => $line) {
            $line = trim($line);
            if (empty($line)) continue;

            $upperLine = strtoupper($line);

            // Section detection - detect if we entered a specific part of the statement
            // Only consider it a section header if it doesn't contain a date or amount
            $hasDateInLine = preg_match(self::DATE_REGEX, $line);
            $hasAmountInLine = preg_match(self::AMOUNT_REGEX, $line);

            if (!$hasDateInLine && !$hasAmountInLine) {
                $hasDebitHeader = preg_match('/\b(DEBITS?|WITHDRAWALS?|PAYMENTS?|OUTGOINGS?|CHARGES?)\b/', $upperLine);
                $hasCreditHeader = preg_match('/\b(CREDITS?|DEPOSITS?|ADDITIONS?|INCOME?|REFUNDS?|RECEIPTS?)\b/', $upperLine);
                
                if ($hasDebitHeader && $hasCreditHeader) {
                    // Likely a multi-column header line, reset section mode but clear buffers
                    $currentSection = null; 
                    $lastDate = null;
                    $lastVendor = null;
                    continue;
                } elseif ($hasDebitHeader && !str_contains($upperLine, 'TOTAL') && !str_contains($upperLine, 'SUMMARY')) {
                    $currentSection = 'debit';
                    continue;
                } elseif ($hasCreditHeader && !str_contains($upperLine, 'TOTAL') && !str_contains($upperLine, 'SUMMARY')) {
                    $currentSection = 'credit';
                    continue;
                }
            }

            // Extract account number if found
            if ($accountNumber === null) {
                if (preg_match(self::ACCOUNT_REGEX, $line, $accMatches)) {
                    $accountNumber = $accMatches[1];
                } elseif (preg_match('/(?:Account|Acc|Acct|A\/c)(?:\s*(?:Number|#|No\.?))\s*[:|-]?\s*$/i', $line)) {
                    // Check next line for the number if this line only has the label
                    if (isset($lines[$i+1])) {
                        $nextLine = trim($lines[$i+1]);
                        if (preg_match('/^([\d-]+)/', $nextLine, $nextAccMatches)) {
                            $accountNumber = $nextAccMatches[1];
                        }
                    }
                }
            }

            // Skip very long lines which are likely paragraphs of text
            if (strlen($line) > 200) continue;

            $upperLine = strtoupper($line);

            // Look for initial balance
            if ($this->runningBalance === null && (str_contains($upperLine, 'BALANCE AS OF') || str_contains($upperLine, 'SUMMARY'))) {
                if (preg_match_all(self::AMOUNT_REGEX, $line, $summaryMatches)) {
                    $this->runningBalance = $this->parseAmount(end($summaryMatches[1]));
                }
            }

            $isBlacklisted = false;
            foreach (self::BLACKLIST_KEYWORDS as $keyword) {
                if (str_contains($upperLine, $keyword)) {
                    $isBlacklisted = true;
                    break;
                }
            }
            if ($isBlacklisted) {
                // If we see a blacklisted word like "BALANCE", clear the buffered vendor/date
                // to avoid mis-attributing it to a later line.
                $lastDate = null;
                $lastVendor = null;
                continue;
            }

            // Also ignore common header lines explicitly
            if (preg_match('/(Account\s*#|Statement\s+Period|Cust\s+Ref|Primary\s+Account|Page:)/i', $line)) {
                $lastDate = null;
                $lastVendor = null;
                continue;
            }

            $foundDate = null;
            if (preg_match(self::DATE_REGEX, $line, $dateMatches)) {
                $foundDate = $this->normalizeDate($dateMatches[1], $statementYear);
            }

            if (preg_match_all(self::AMOUNT_REGEX, $line, $amountMatches, PREG_SET_ORDER)) {
                $nonZeroMatches = array_filter($amountMatches, function($m) {
                    $val = $this->parseAmount($m[1]);
                    return $val !== null && $val > 0.01;
                });
                $nonZeroMatches = array_values($nonZeroMatches);

                if (!empty($nonZeroMatches)) {
                    $isCredit = false;
                    if ($currentSection === 'credit') {
                        $isCredit = true;
                    }

                    $transactionAmount = null;
                    $foundBalance = null;

                    if (count($nonZeroMatches) >= 2) {
                        // Usually: [Transaction Amount, Running Balance]
                        $transactionAmount = $this->parseAmount($nonZeroMatches[0][1]);
                        $foundBalance = $this->parseAmount($nonZeroMatches[count($nonZeroMatches)-1][1]);
                        
                        // Check if this was a credit or debit based on balance change
                        if ($this->runningBalance !== null && $foundBalance !== null) {
                            $diff = $foundBalance - $this->runningBalance;
                            // If balance increased significantly, it's a credit
                            if ($diff > 0.01) {
                                $isCredit = true;
                            }
                        }
                        
                        $this->runningBalance = $foundBalance;
                        $amount = $transactionAmount;
                    } else {
                        // Single amount - might be just a balance or just a transaction
                        $amount = $this->parseAmount($nonZeroMatches[0][1]);
                    }

                    // Check for signs in the raw amount string - plus usually means credit/money in
                    $rawAmount0 = $nonZeroMatches[0][1];
                    if (str_contains($rawAmount0, '+')) {
                        $isCredit = true;
                    }

                    // Check for explicit CR/DR markers in the amount itself
                    if (!$isCredit && isset($nonZeroMatches[0][2])) {
                        $marker = strtoupper($nonZeroMatches[0][2]);
                        if ($marker === 'CR') {
                            $isCredit = true;
                        } elseif ($marker === 'DR') {
                            $isCredit = false; // Explicitly a debit
                        }
                    }

                    // Check for credit keywords in the entire line if still not identified as credit
                    if (!$isCredit) {
                        $lowerLine = strtolower($line);
                        $creditKeywords = [
                            'refund', 'credit', 'deposit', 'reversal', 'interest paid', 
                            'payment received', 'funds received', 'cr ', ' cr',
                            'transfer from', 'incoming', 'direct deposit', 'giro',
                            'cash back', 'dividend', 'rebate', 'total credits'
                        ];
                        foreach ($creditKeywords as $kw) {
                            if (str_contains($lowerLine, $kw)) {
                                $isCredit = true;
                                break;
                            }
                        }
                    }

                    if ($amount !== null && $amount > 0.01) {
                        // Use current date or buffered date from previous line
                        $dateToUse = $foundDate ?: $lastDate;
                        
                        // Extract vendor from this line, or use buffered vendor if this line is just an amount
                        $allAmountsInLine = array_column($amountMatches, 0);
                        $vendorInLine = $this->extractVendor($line, $foundDate ? $dateMatches[0] : '', $allAmountsInLine);
                        
                        $vendorToUse = $vendorInLine;
                        if (empty($vendorInLine) && $lastVendor) {
                            $vendorToUse = $lastVendor;
                        }

                        if ($dateToUse && $amount && !empty($vendorToUse) && $this->isLikelyTransaction($vendorToUse, $amount)) {
                            // If it's a credit, skip (only expenses wanted)
                            if ($isCredit) {
                                $lastDate = null;
                                $lastVendor = null;
                                continue;
                            }

                            $expenses[] = [
                                'transaction_date' => $dateToUse,
                                'vendor_name' => $vendorToUse,
                                'expense_amount' => number_format($amount, 2, '.', ''),
                                'buyer_name' => '',
                                'transaction_desc' => $vendorToUse,
                                'transaction_notes' => '',
                                'project_id' => null,
                                'cost_centre_id' => null,
                                'account_number_id' => null,
                            ];
                            
                            // Clear buffer after successful extraction
                            $lastDate = null;
                            $lastVendor = null;
                            continue;
                        }
                    }
                }
            }

            // If we found a date but no transaction on this line, buffer it for the next line
            if ($foundDate) {
                $lastDate = $foundDate;
                // If there's extra text on the date line, it might be the vendor start
                $vendorStart = trim(str_replace($dateMatches[0], '', $line));
                $lastVendor = $this->isLikelyTransaction($vendorStart, 1.0) ? $vendorStart : null;
            } elseif (!empty($line) && !$foundDate && !$lastVendor) {
                // If it's just a text line, it might be a vendor name between a date line and an amount line
                if ($this->isLikelyTransaction($line, 1.0)) {
                    $lastVendor = $line;
                }
            }
        }

        // Deduplicate
        $expenses = $this->deduplicate($expenses);

        // Apply the common account number to all transactions
        if ($accountNumber) {
            foreach ($expenses as &$expense) {
                $expense['account_number'] = $accountNumber;
            }
        }
        
        return [
            'expenses' => $expenses,
            'refunds' => [],
            'paired' => 0,
            'account_number' => $accountNumber
        ];
    }

    private function isLikelyTransaction(string $vendor, float $amount): bool
    {
        // Avoid things that look like version numbers or dates in the vendor field
        if (preg_match('/^\d+(\.\d+)+$/', $vendor)) return false;
        
        // Avoid too short vendors
        if (strlen($vendor) < 3) return false;

        // Common non-vendor words in long strings
        $noise = ['PROCESSING', 'TRANSACTIONS', 'PENDING', 'ORDER', 'BEGAN', 'BALANCE', 'SUMMARY', 'STATEMENT', 'CONTINUED', 'IMPORTANT', 'INFORMATION', 'DESCRIPTION'];
        $upperVendor = strtoupper($vendor);
        
        // Avoid single words that are just months (likely part of a header)
        $months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JAN', 'FEB', 'MAR', 'APR', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        if (in_array($upperVendor, $months)) return false;

        $noiseCount = 0;
        foreach ($noise as $word) {
            if (str_contains($upperVendor, $word)) $noiseCount++;
        }
        
        if ($noiseCount >= 2) return false;

        return true;
    }

    private function extractStatementYear(string $text): ?int
    {
        if (preg_match(self::YEAR_REGEX, $text, $matches)) {
            return (int)$matches[1];
        }
        return (int)date('Y');
    }

    private function normalizeDate(string $raw, ?int $statementYear): ?string
    {
        $raw = trim($raw);
        $formats = [
            'd/m/Y', 'm/d/Y', 'd-m-Y', 'Y-m-d',
            'd M Y', 'd F Y', 'M d, Y', 'F d, Y',
            'd/m/y', 'm/d/y', 'd-m-y'
        ];

        foreach ($formats as $fmt) {
            $dt = \DateTime::createFromFormat($fmt, $raw);
            if ($dt !== false) {
                return $dt->format('Y-m-d');
            }
        }

        if ($statementYear) {
            $shortFormats = ['m d', 'd m', 'M d', 'd M', 'F d', 'd F', 'm/d', 'd/m'];
            foreach ($shortFormats as $fmt) {
                $dt = \DateTime::createFromFormat($fmt, $raw);
                if ($dt !== false) {
                    $dt->setDate($statementYear, (int)$dt->format('m'), (int)$dt->format('d'));
                    return $dt->format('Y-m-d');
                }
            }
        }

        return null;
    }

    private function parseAmount(string $text): ?float
    {
        $cleaned = preg_replace('/[^\d.]/', '', $text);
        
        // Handle common OCR noise where a comma is read as a dot in thousands (e.g. 1.124 instead of 1124)
        if (preg_match('/^\d\.\d{3}$/', $cleaned)) {
            $cleaned = str_replace('.', '', $cleaned);
        }
        
        $val = (float)$cleaned;
        return ($val > 0 && $val < 1000000) ? $val : null;
    }

    private function extractVendor(string $line, string $dateStr, array|string $amounts): string
    {
        $line = str_replace($dateStr, '', $line);
        if (is_array($amounts)) {
            foreach ($amounts as $amt) {
                $line = str_replace($amt, '', $line);
            }
        } else {
            $line = str_replace($amounts, '', $line);
        }
        
        // Remove common bank markers that clutter the description/vendor name
        $markers = [
            '/PURCHASE\s*-?\s*/i', 
            '/DEBIT\s*-?\s*/i', 
            '/CREDIT\s*-?\s*/i',
            '/CR\s*/i',
            '/VISA\s*/i', 
            '/MASTERCARD\s*/i', 
            '/M\/C\s*/i', 
            '/INTERAC\s*-?\s*/i', 
            '/RETAIL\s*/i',
            '/\s\d{4,}(\s|$)/', // Remove isolated long numbers (ref codes)
        ];
        $line = preg_replace($markers, ' ', $line);

        // Common bank-specific noise that shouldn't be part of vendor names
        $bankNoise = [
            '/TD\s+Bank/i',
            '/TD\s+Convenience/i',
            '/Checking/i',
            '/Account\s*#\s*\d+/i',
            '/Statement\s+Period/i',
            '/America\'s\s+Most\s+Convenient\s+Bank/i'
        ];
        $line = preg_replace($bankNoise, ' ', $line);

        $line = trim($line, " \t\n\r\0\x0B-_.,;:/\\$|");
        $line = preg_replace('/\s+/', ' ', $line);
        return strlen($line) >= 2 ? $line : '';
    }

    private function deduplicate(array $expenses): array
    {
        $seen = [];
        $result = [];
        foreach ($expenses as $exp) {
            $key = $exp['transaction_date'] . $exp['vendor_name'] . $exp['expense_amount'];
            if (!isset($seen[$key])) {
                $seen[$key] = true;
                $result[] = $exp;
            }
        }
        return $result;
    }

    private function pairRefunds(array $expenses, array $refunds): array
    {
        $pairedIndices = [];
        $unmatched = [];
        $pairs = 0;

        foreach ($refunds as $refund) {
            $rVendor = $this->normalizeVendorKey($refund['vendor_name']);
            $rAmount = abs((float)$refund['expense_amount']);
            $rDate = new \DateTime($refund['transaction_date']);

            $matchedIdx = null;
            foreach ($expenses as $i => $pos) {
                if (in_array($i, $pairedIndices)) continue;
                
                if ($this->normalizeVendorKey($pos['vendor_name']) !== $rVendor) continue;
                
                $pAmount = (float)$pos['expense_amount'];
                if (abs($pAmount - $rAmount) > 0.01) continue;
                
                $pDate = new \DateTime($pos['transaction_date']);
                $diff = abs($rDate->getTimestamp() - $pDate->getTimestamp()) / (60 * 60 * 24);
                
                if ($diff > 60) continue;
                
                $matchedIdx = $i;
                break;
            }

            if ($matchedIdx !== null) {
                $pairedIndices[] = $matchedIdx;
                $pairs++;
            } else {
                $unmatched[] = $refund;
            }
        }

        $remaining = [];
        foreach ($expenses as $i => $p) {
            if (!in_array($i, $pairedIndices)) {
                $remaining[] = $p;
            }
        }

        return [$remaining, $unmatched, $pairs];
    }

    private function normalizeVendorKey(string $vendor): string
    {
        return preg_replace('/[^a-z0-9]/', '', strtolower($vendor));
    }
}
