<?php

namespace App\Services;

use App\Enums\ClaimType;
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
    private $isCreditCardStyle = false; // True if balance increases on spend (Credit Card), False if balance decreases (Bank Account)
    
    private const DATE_REGEX = '/\b(\d{1,2}\s*[\/\-\.]\s*\d{1,2}(?:\s*[\/\-\.]\s*\d{2,4})?(?!\d)|\d{4}\s*[\/\-]\s*\d{2}\s*[\/\-]\s*\d{2}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:\s+\d{4})?|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:,?\s+\d{4})?)\b/i';
    private const FALLBACK_DATE_REGEX = '/\b(\d{3,4})\b/'; // Matches 1116 as Nov 16
    private const AMOUNT_REGEX = '/(?<![0-9,.\/])\$?\s*([+-]?\s*(?:\d{1,3}(?:,\d{3})*(?:\.\d{1,3})?|\d+\.\d{1,3}|\d{1,6}))\s*(DR|CR)?(?![0-9,.\/])/i';
    private const YEAR_REGEX = '/\b(20\d{2})\b/';
    private const ACCOUNT_REGEX = '/(?:Account|Acc|Acct|A\/c)(?:\s*(?:Number|#|No\.?))?\s*[:|-]?\s*([\d-]+)/i';
    
    private const BLACKLIST_KEYWORDS = [
        'BALANCE', 'SUMMARY', 'STATEMENT', 'PAGE', 'DATE', 'DESCRIPTION', 
        'CLOSING', 'OPENING', 'PREVIOUS', 'MINIMUM', 
        'ANNUAL', 'PERCENTAGE', 'BEGAN PROCESSING'
    ];
    
    public function extract(string $filePath, string $mimeType, int $claimTypeId = 0): array
    {
        $text = $this->extractText($filePath, $mimeType);
        if (empty($text)) {
            Log::warning('Extractor: No text extracted from file');
            return ['expenses' => [], 'refunds' => [], 'paired' => 0];
        }

        // Log a sample of the text to help debug extraction issues
        Log::info('[OCR DEBUG] Extracted text sample: ' . substr(str_replace("\n", " | ", $text), 0, 2000));
        
        return $this->parseText($text, $claimTypeId);
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

    private function parseText(string $text, int $claimTypeId = 0): array
    {
        $lines = explode("\n", $text);
        $expenses = [];
        $refunds = [];
        $accountNumber = null;
        $statementYear = $this->extractStatementYear($text);
        $this->runningBalance = null;
        $isCorporateCard = ($claimTypeId === ClaimType::CORPORATE_CARD);

        // Detect if this is a Credit Card style account (balance increases on spend) 
        // vs a Bank Account style (balance decreases on spend).
        // Default to the claim type, but override if keywords suggest otherwise.
        $this->isCreditCardStyle = $isCorporateCard;
        if (preg_match('/(?:Checking|Savings|Current|Debit|Deposit Account)/i', $text)) {
            $this->isCreditCardStyle = false;
        } elseif (preg_match('/(?:Credit Card|Visa|Mastercard|Amex)/i', $text)) {
            $this->isCreditCardStyle = true;
        }

        Log::info("[Extractor] Starting parse: isCorporateCard=" . ($isCorporateCard ? 'YES' : 'NO') . ", isCreditCardStyle=" . ($this->isCreditCardStyle ? 'YES' : 'NO') . ", year=" . $statementYear);

        $lastDate = null;
        $lastVendor = null;
        $currentSection = null; // 'debit' or 'credit'

        foreach ($lines as $i => $line) {
            $line = trim($line);
            if (empty($line)) continue;

            $upperLine = strtoupper($line);
            
            // Clean noise words that often appear in footers or headers but contain numbers
            if (preg_match('/(?:Call|Phone|www\.|http|Fax|Tel|Address|Member|FDIC|Equal Housing)/i', $line)) {
                Log::debug("[Extractor] Skipping noise line: $line");
                continue;
            }

            // Section detection - detect if we entered a specific part of the statement
            // ... (rest of the section detection remains same)
            $hasDateInLine = preg_match(self::DATE_REGEX, $line);
            $hasAmountInLine = preg_match(self::AMOUNT_REGEX, $line);

            if (!$hasDateInLine && !$hasAmountInLine && strlen($line) < 50) {
                // For Corporate Cards, "PAYMENTS" are usually CREDITS (money in)
                // whereas for regular bank accounts they are DEBITS (money out)
                $hasDebitHeader = preg_match('/\b(DEBITS?|WITHDRAWALS?|OUTGOINGS?|CHARGES?|PURCHASES?)\b/i', $upperLine);
                $hasCreditHeader = preg_match('/\b(CREDITS?|DEPOSITS?|ADDITIONS?|INCOME?|REFUNDS?|RECEIPTS?)\b/i', $upperLine);
                
                if ($isCorporateCard) {
                    $hasCreditHeader = $hasCreditHeader || preg_match('/\bPAYMENTS?\b/i', $upperLine);
                } else {
                    $hasDebitHeader = $hasDebitHeader || preg_match('/\bPAYMENTS?\b/i', $upperLine);
                }
                
                if ($hasDebitHeader && $hasCreditHeader) {
                    Log::info("[Extractor] Multi-column header found: $line");
                    $currentSection = null; 
                    $lastDate = null;
                    $lastVendor = null;
                    continue;
                } elseif ($hasDebitHeader && !preg_match('/(?:TOTAL|SUMMARY|BALANCE|PROCESS)/i', $upperLine)) {
                    // Check if the next non-empty line is a CREDIT header - if so, it's a multi-column header
                    $isMultiColumn = false;
                    for ($j = $i + 1; $j < min($i + 4, count($lines)); $j++) {
                        $nextLine = strtoupper(trim($lines[$j]));
                        if (empty($nextLine)) continue;
                        if (preg_match('/\b(CREDITS?|DEPOSITS?|ADDITIONS?|INCOME?|REFUNDS?|RECEIPTS?)\b/i', $nextLine)) {
                            $isMultiColumn = true;
                            break;
                        }
                        if (preg_match(self::DATE_REGEX, $nextLine) || preg_match(self::AMOUNT_REGEX, $nextLine)) break;
                    }
                    
                    if ($isMultiColumn) {
                        Log::info("[Extractor] Multi-column header found (split lines): $line");
                        $currentSection = null;
                    } else {
                        Log::info("[Extractor] Entered DEBIT section: $line");
                        $currentSection = 'debit';
                    }
                    continue;
                } elseif ($hasCreditHeader && !preg_match('/(?:TOTAL|SUMMARY|BALANCE|PROCESS)/i', $upperLine)) {
                    // Check if the previous non-empty line was a DEBIT header
                    $isMultiColumn = false;
                    for ($j = $i - 1; $j >= max(0, $i - 3); $j--) {
                        $prevLine = strtoupper(trim($lines[$j]));
                        if (empty($prevLine)) continue;
                        if (preg_match('/\b(DEBITS?|WITHDRAWALS?|PAYMENTS?|OUTGOINGS?|CHARGES?)\b/i', $prevLine)) {
                            $isMultiColumn = true;
                            break;
                        }
                        if (preg_match(self::DATE_REGEX, $prevLine) || preg_match(self::AMOUNT_REGEX, $prevLine)) break;
                    }

                    if ($isMultiColumn) {
                        Log::info("[Extractor] Multi-column header found (split lines): $line");
                        $currentSection = null;
                    } else {
                        Log::info("[Extractor] Entered CREDIT section: $line");
                        $currentSection = 'credit';
                    }
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
            if ($this->runningBalance === null && (preg_match('/(?:BALANCE AS OF|SUMMARY|BEGINNING|PREVIOUS|OPENING|BALANCE\s+FORWARD)/i', $upperLine))) {
                if (preg_match_all(self::AMOUNT_REGEX, $line, $summaryMatches)) {
                    // Try to find the first likely balance amount in a summary line
                    foreach ($summaryMatches[1] as $possibleBalance) {
                        $parsed = $this->parseAmount($possibleBalance);
                        // A balance is usually a significant number
                        if ($parsed !== null && $parsed > 0.01) {
                            $this->runningBalance = $parsed;
                            Log::info("[Extractor] Initial running balance detected: $this->runningBalance from line: $line");
                            break;
                        }
                    }
                }
            }

            $isBlacklisted = false;
            foreach (self::BLACKLIST_KEYWORDS as $keyword) {
                // For 'DATE' and 'DESCRIPTION', be more specific to avoid blacklisting vendors or lines with data
                if ($keyword === 'DATE' || $keyword === 'DESCRIPTION') {
                    if (preg_match('/\b' . $keyword . '\b/i', $upperLine) && strlen($line) < 30) {
                        $isBlacklisted = true;
                        break;
                    }
                } elseif (str_contains($upperLine, $keyword)) {
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
            } elseif (preg_match(self::FALLBACK_DATE_REGEX, $line, $dateMatches) && strlen($line) < 30) {
                // If we find 3-4 digits at the start of a line and it matches MMDD pattern
                $foundDate = $this->normalizeDate($dateMatches[1], $statementYear);
                if ($foundDate) {
                    Log::debug("[Extractor] Found fallback date: $foundDate from $dateMatches[1]");
                }
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
                            
                            if ($this->isCreditCardStyle) {
                                // For Credit Cards, a balance INCREASE is typically a DEBIT (expense)
                                // and a balance DECREASE is a CREDIT (payment/refund)
                                if ($diff > 0.0001) {
                                    $isCredit = false;
                                } elseif ($diff < -0.0001) {
                                    $isCredit = true;
                                }
                            } else {
                                // For standard Bank Accounts, a balance INCREASE is a CREDIT (money in)
                                // and a balance DECREASE is a DEBIT (money out)
                                if ($diff > 0.0001) {
                                    $isCredit = true;
                                } elseif ($diff < -0.0001) {
                                    $isCredit = false;
                                }
                            }

                            // OCR Correction: If the difference matches another interpretation of the amount, use it.
                            // For example, if amount was read as 1124 but diff is 124.00, or 1200 vs 12.00
                            $absDiff = abs($diff);
                            if ($absDiff > 0.01 && $transactionAmount !== null) {
                                // Check if inserting a decimal point into transactionAmount makes it match absDiff
                                // or if they are just off by a factor of 10/100
                                $rawNum = (string)$transactionAmount;
                                $possibleMatches = [
                                    (float)$rawNum,
                                    (float)$rawNum / 10,
                                    (float)$rawNum / 100,
                                    (float)$rawNum / 1000
                                ];
                                
                                foreach ($possibleMatches as $pm) {
                                    if (abs($pm - $absDiff) < 0.05) {
                                        if (abs($transactionAmount - $absDiff) > 0.01) {
                                            Log::info("[Extractor] Correcting amount from $transactionAmount to $absDiff based on balance change");
                                            $transactionAmount = $absDiff;
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                        
                        $this->runningBalance = $foundBalance;
                        $amount = $transactionAmount;
                    } else {
                        // Single amount - might be just a balance or just a transaction
                        $amount = $this->parseAmount($nonZeroMatches[0][1]);
                        
                        // If we have a previous balance, we can check if this single amount 
                        // explains a change to a future balance, but for single-amount lines 
                        // we usually rely on markers or keywords.
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
                        if (!empty($vendorToUse)) {
                            $lowerLine .= ' ' . strtolower($vendorToUse);
                        }
                        
                        // If it contains "AMAZON" and we are in corporate card mode, it's very likely a debit (expense)
                        // even if it matches some broad credit keywords by accident.
                        $isKnownExpenseVendor = $isCorporateCard && preg_match('/AMAZON|UBER|LYFT|STARBUCKS|WALMART|SHELL|PETRO|APPLE|GOOGLE|MICROSOFT|ADOBE/i', $lowerLine);

                        if ($isKnownExpenseVendor) {
                            $isCredit = false; // Force debit for known expense vendors on corporate cards
                        } else {
                            $creditKeywords = [
                                'refund', 'credit', 'deposit', 'reversal', 'interest paid', 
                                'payment received', 'funds received', 'cr ', ' cr',
                                'transfer from', 'incoming', 'direct deposit', 'giro',
                                'cash back', 'dividend', 'rebate', 'total credits',
                                'interest credit', 'adjustment credit', 'fee reversal',
                                'payment - thank you', 'payment-thank you', 'auth payment',
                                'online payment', 'mobile payment', 'cheque deposit',
                                'atm deposit', 'pre-authorized payment credit'
                            ];
                            foreach ($creditKeywords as $kw) {
                                if (str_contains($lowerLine, $kw)) {
                                    $isCredit = true;
                                    break;
                                }
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

                        Log::debug("[Extractor] Line check: line=$line, date=$dateToUse, amount=$amount, vendor=$vendorToUse, credit=" . ($isCredit ? 'Y' : 'N'));

                        if ($amount && !empty($vendorToUse) && $this->isLikelyTransaction($vendorToUse, $amount)) {
                            if (!$dateToUse) {
                                Log::debug("[Extractor] Skipping transaction - no date found: $vendorToUse | $amount");
                                continue;
                            }
                            
                            // If it's a credit, skip (only expenses wanted)
                            if ($isCredit) {
                                Log::info("[Extractor] Skipping credit transaction: $vendorToUse | $amount (line: $line)");
                                $lastDate = null;
                                $lastVendor = null;
                                continue;
                            }

                            Log::info("[Extractor] Found debit transaction: $vendorToUse | $amount");
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
        $vendor = trim($vendor);
        if (empty($vendor)) return false;

        $upperVendor = strtoupper($vendor);

        // Always allow known common expense vendors even if they look like noise or are short
        if (preg_match('/AMAZON|UBER|LYFT|STARBUCKS|WALMART|SHELL|PETRO|APPLE|GOOGLE|MICROSOFT|ADOBE/i', $upperVendor)) {
            return true;
        }

        // Avoid things that look like common date formats (e.g. 11/10/2019)
        if (preg_match('/^\d{1,2}[\.\/]\d{1,2}[\.\/]\d{2,4}$/', $vendor)) return false;
        
        // Avoid too short vendors
        if (strlen($vendor) < 2) return false;

        // If it's just numbers, it might be a reference number or a misread vendor
        // Only allow it if it's reasonably long (likely a ref number we can use as vendor)
        if (preg_match('/^\d+$/', $vendor) && strlen($vendor) < 3) return false;

        // Common non-vendor words in long strings
        $noise = ['PROCESSING', 'TRANSACTIONS', 'PENDING', 'ORDER', 'BEGAN', 'BALANCE', 'SUMMARY', 'STATEMENT', 'CONTINUED', 'IMPORTANT', 'INFORMATION', 'DESCRIPTION'];
        
        // Avoid single words that are just months (likely part of a header)
        $months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JAN', 'FEB', 'MAR', 'APR', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        if (in_array($upperVendor, $months)) return false;

        // More noise patterns
        if (preg_match('/(?:WWW\.|HTTP|@)/i', $upperVendor)) return false;

        $noiseCount = 0;
        foreach ($noise as $word) {
            if (str_contains($upperVendor, $word)) $noiseCount++;
        }
        
        // Only reject if multiple noise words are present (likely a header paragraph)
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
        // Remove extra spaces within the date string (e.g., "06 / 19 / 2026" -> "06/19/2026")
        $raw = preg_replace('/\s*([\/\-\.])\s*/', '$1', $raw);
        $raw = preg_replace('/\s+/', ' ', $raw);

        // Handle fallback formats like 1116 (Nov 16)
        if (preg_match('/^\d{3,4}$/', $raw)) {
            $m = (int)substr($raw, 0, strlen($raw) - 2);
            $d = (int)substr($raw, -2);
            if ($m >= 1 && $m <= 12 && $d >= 1 && $d <= 31) {
                if ($statementYear) {
                    return sprintf('%04d-%02d-%02d', $statementYear, $m, $d);
                }
                return sprintf('%04d-%02d-%02d', (int)date('Y'), $m, $d);
            }
        }
        
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
        // Remove spaces and commas inside the amount string
        $text = str_replace([' ', ','], '', $text);
        
        // If it's too long, it's probably a phone number or reference code, not an amount
        if (strlen($text) > 10) return null;

        // If there are multiple dots, it's likely noise or thousand separators. 
        // Keep only the last one as the decimal point.
        if (substr_count($text, '.') > 1) {
            $lastDotPos = strrpos($text, '.');
            $text = str_replace('.', '', substr($text, 0, $lastDotPos)) . substr($text, $lastDotPos);
        }
        
        $cleaned = preg_replace('/[^\d.]/', '', $text);
        
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
            '/\bPURCHASE\b\s*-?\s*/i', 
            '/\bDEBIT\b\s*-?\s*/i', 
            '/\bCREDIT\b\s*-?\s*/i',
            '/\bCR\b\s*/i',
            '/\bVISA\b\s*/i', 
            '/\bMASTERCARD\b\s*/i', 
            '/\bM\/C\b\s*/i', 
            '/\bINTERAC\b\s*-?\s*/i', 
            '/\bRETAIL\b\s*/i',
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
