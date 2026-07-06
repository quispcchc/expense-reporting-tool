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
    
    private const DATE_REGEX = '/\b(\d{1,2}\s*[\/\-\.]\s*\d{1,2}(?:\s*[\/\-\.]\s*\d{2,4})?(?!\d)|\d{4}\s*[\/\-]\s*\d{2}\s*[\/\-]\s*\d{2}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:\s+\d{4})?|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{1,2}(?:\s*[,.]?\s*\d{4})?)(?=\b|\s|$)/i';
    private const FALLBACK_DATE_REGEX = '/^(?:\s*)(\d{3,4})(?:\s*)$/'; // Only match if it's the entire line or clearly isolated
    private const AMOUNT_REGEX = '/(?<![0-9,.\/])([+-]?\s*\$?\s*\d{1,3}(?:,\d{3})*\.\d{2}|[+-]?\s*\$?\s*\d+\.\d{2}|\$[+-]?\s*\d{1,6}(?:,\d{3})?)\s*(DR|CR)?(?![0-9,.\/])/i';
    private const YEAR_REGEX = '/\b(20\d{2})\b/';
    private const ACCOUNT_REGEX = '/(?:Account|Acc|Acct|A\/c)(?:\s*(?:Number|#|No\.?))?\s*[:|-]?\s*([\d-]{3,})/i';
    
    private const BLACKLIST_KEYWORDS = [
        'BALANCE', 'SUMMARY', 'STATEMENT', 'PAGE', 'DATE', 'DESCRIPTION', 
        'CLOSING', 'OPENING', 'PREVIOUS', 'MINIMUM', 
        'ANNUAL', 'PERCENTAGE', 'BEGAN PROCESSING',
        'POINTS', 'REWARD', 'AEROPLAN', 'BONUS', 'EARNED',
        'CUSTOMER SERVICE', 'TTY', 'INQUIRIES', 'WEBSITE',
        'P.O. BOX', 'AGINCOURT', 'ONTARIO', 'M1S 517',
        'TD CANADA TRUST', 'TD MESSAGE CENTRE', 'AIR CANADA', 'CONTACT INFORMATION', 'TOSTM', 'T0STM',
        'PAYMENT DUE', 'PAYMENT INFO', 'CREDIT LIMIT', 'AVAILABLE CREDIT', 'INTEREST RATE', 'ESTIMATED TIME'
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

            Log::info('[VISION DEBUG] Extracted text length=' . strlen($text) . ' sample=' . substr(str_replace("\n", ' | ', $text), 0, 3000));

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


    private function normalizeOcrLine(string $line): string
    {
        // Fix common OCR mistakes that break dates and money parsing.
        // Replace 'I', '|', 'l' with '1' in compact/spaced date formats at the end of a month token
        // Handles: OCT3I -> OCT31, OCT 3I -> OCT 31, NOV I -> NOV 1, etc.
        $line = preg_replace('/\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)\s*([0-3]?)[I|l|\|]\b/i', '${1} ${2}1', $line);
        
        // Handle common month OCR errors
        $line = preg_replace('/\b0CT\b/i', 'OCT', $line);
        $line = preg_replace('/\bN0V\b/i', 'NOV', $line);
        $line = preg_replace('/\bDBC\b/i', 'DEC', $line);
        
        // Handle S instead of 5 in dates (e.g. OCT 2S -> OCT 25)
        $line = preg_replace('/\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)\s*([0-3]?)S\b/i', '${1} ${2}5', $line);

        $line = preg_replace('/\bDEC\.\s*/i', 'DEC', $line);

        // Some OCR outputs use different dash/currency characters.
        $line = str_replace(['−', '–', '—'], '-', $line);
        $line = str_replace(['＄'], '$', $line);

        return $line;
    }

    private function isTransactionTableHeader(string $upperLine): bool
    {
        return (bool) preg_match('/TRANSACT[I01]ON\s+POST[I01]NG\s+ACT[I01]V[I01]TY\s+DESCR[I01]PT[I01]ON\s+AMOUNT/i', $upperLine)
            || (bool) preg_match('/TRANSACT[I01]ON\s+DATE.*POST[I01]NG\s+DATE.*AMOUNT/i', $upperLine)
            || (bool) preg_match('/DATE\s+DATE\s+.*AMOUNT/i', $upperLine)
            || (bool) preg_match('/DATE\s+DATE\s+DESCR[I01]PT[I01]ON\s+AMOUNT/i', $upperLine)
            || (bool) preg_match('/ACT[I01]V[I01]TY\s+DESCR[I01]PT[I01]ON.*AMOUNT/i', $upperLine)
            || (bool) preg_match('/TRANSACT[I01]ON.*POST[I01]NG.*DESCR[I01]PT[I01]ON.*AMOUNT/i', $upperLine)
            || (bool) preg_match('/DESCRIPTION\s+AMOUNT/i', $upperLine);
    }

    private function isTransactionTableEnd(string $upperLine): bool
    {
        return (bool) preg_match(
            '/NET\s+AMOUNT\s+OF\s+MONTHLY|TOTAL\s+NEW\s+BALANCE|TD\s+MESSAGE\s+CENTRE|CALCULATING\s+YOUR\s+BALANCE|PAYMENT\s+DUE\s+DATE|CONTACT\s+INFORMATION|TD\s+CANADA\s+TRUST/i',
            $upperLine
        );
    }

    private function isSideInfo(string $upperLine): bool
    {
        // Detect side panel info or non-transactional noise that should clear buffers
        return (bool) preg_match('/\bYEAR\(S\)\b|\bMONTH\(S\)\b|\bSTATEMENT\s+PERIOD\b|\bACCOUNT\s+SUMMARY\b|\bCREDIT\s+LIMIT\b|\bAVAILABLE\s+CREDIT\b|\bSTATEMENT\b|\bPAYMENT\s+INFO|\bPAYMENT\s+DUE/i', $upperLine)
            || (bool) preg_match('/^[A-Z]{3}\s+\d{1,2},\s+20\d{2}$/i', $upperLine); // e.g. DEC 15, 2022
    }

    private function parseText(string $text, int $claimTypeId = 0): array
    {
        $lines = explode("\n", $text);
        $expenses = [];
        $refunds = [];
        $accountNumber = null;
        $statementYear = $this->extractStatementYear($text);
        $this->runningBalance = null;

        // TD Business Travel Visa has a fixed table layout, but OCR/PDF text often mixes
        // the right-side payment/rewards panels into the transaction lines. Use a strict
        // TD-only parser so side-panel text like "Promotions & Adjustments",
        // "Payment Due Date", marketing copy, and foreign-currency note lines are not
        // treated as vendors.
        if (preg_match('/TD\s+BUSINESS\s+TRAVEL\s+VISA\s+CARD/i', $text)) {
            return $this->parseTdBusinessTravelVisa($text, $statementYear);
        }

        $isCorporateCard = ($claimTypeId === ClaimType::CORPORATE_CARD);

        // Detect if this is a Credit Card style account (balance increases on spend) 
        // vs a Bank Account style (balance decreases on spend).
        $this->isCreditCardStyle = $isCorporateCard;
        if (preg_match('/(?:Checking|Savings|Current|Debit|Deposit Account|Bank Statement|Bank Account)/i', $text)) {
            $this->isCreditCardStyle = false;
        } 
        
        // Explicit Credit Card keywords take precedence
        if (preg_match('/(?:Credit Card|Visa|Mastercard|Amex|American Express|Discover|Capital One|Chase|Citibank|MBNA|BMO Mastercard|RBC Visa|AEROPLAN)/i', $text)) {
            $this->isCreditCardStyle = true;
        }

        // Specifically for TD, "Visa" or "Infinite" or "Privilege" usually means Credit Card
        if (preg_match('/(?:Infinite|Privilege|Gold|Platinum|Emerald)/i', $text) && str_contains(strtoupper($text), 'TD')) {
            $this->isCreditCardStyle = true;
        }

        Log::info("[Extractor] Starting parse: isCorporateCard=" . ($isCorporateCard ? 'YES' : 'NO') . ", isCreditCardStyle=" . ($this->isCreditCardStyle ? 'YES' : 'NO') . ", year=" . $statementYear);

        $lastDate = null;
        $lastVendor = null;
        $currentSection = null; // 'debit' or 'credit'
        $insideTransactionTable = false;
        $transactionTableModeDetected = false;
        $ccPendingTransactionDate = null;
        $ccPendingVendor = null;

        foreach ($lines as $i => $line) {
            $line = $this->normalizeOcrLine(trim($line));
            if (empty($line)) continue;

            $upperLine = strtoupper($line);

            // For credit card statements, parse only the transaction table.
            // This prevents footer/account/payment-summary lines like "MR 4520" or "TOSTM21000" from becoming fake expenses.
            if ($this->isTransactionTableHeader($upperLine)) {
                $insideTransactionTable = true;
                $transactionTableModeDetected = true;
                $lastDate = null;
                $lastVendor = null;
                Log::info("[Extractor] Entered transaction table: $line");
                continue;
            }

            if ($insideTransactionTable && $this->isTransactionTableEnd($upperLine)) {
                $insideTransactionTable = false;
                $lastDate = null;
                $lastVendor = null;
                Log::info("[Extractor] Left transaction table: $line");
                continue;
            }

            if ($this->isSideInfo($upperLine)) {
                Log::info("[Extractor] Side info detected, clearing buffers: $line");
                $lastDate = null;
                $lastVendor = null;
                $ccPendingTransactionDate = null;
                $ccPendingVendor = null;
                continue;
            }

            if ($this->isCreditCardStyle && $transactionTableModeDetected && !$insideTransactionTable) {
                // Once we have entered and left a transaction table in CC mode, 
                // do not process anything else to avoid side-panel/bottom-panel noise.
                continue;
            }

            if ($this->isCreditCardStyle && !$transactionTableModeDetected && !$insideTransactionTable) {
                // For credit card statements, skip everything until we find the transaction table header.
                // This prevents side-panel summaries or interest rates from being mis-parsed as expenses.
                continue;
            }

            // Dedicated parser for credit-card transaction-table rows.
            // Supports both normal OCR rows and Google Vision column-style OCR where each cell appears on its own line.
            if ($insideTransactionTable) {
                // Remove some noise from the line before parsing if it's clearly a noise row
                if ($this->isSideInfo($upperLine)) {
                    Log::info("[Extractor] Side info detected inside table, skipping line: $line");
                    continue;
                }

                $creditCardRow = $this->parseCreditCardTransactionTableRow($line, $statementYear);
                if ($creditCardRow !== null) {
                    $vendorToUse = $creditCardRow['vendor'];
                    $amount = $creditCardRow['amount'];
                    $rawAmount = $creditCardRow['raw_amount'] ?? '';

                    if (!$this->isCreditCardPaymentOrCreditRow($vendorToUse, $rawAmount)
                        && !empty($vendorToUse)
                        && $amount !== null
                        && $amount > 0.001 // More lenient for small amounts
                        && $this->isLikelyTransaction($vendorToUse, $amount, true)) {
                        $expenses[] = $this->makeExpense($creditCardRow['date'], $vendorToUse, $amount);
                    } elseif ($this->isCreditCardPaymentOrCreditRow($vendorToUse, $rawAmount)) {
                        // Optionally track refunds/payments from the table
                        $refunds[] = $this->makeExpense($creditCardRow['date'], $vendorToUse, $amount);
                    }

                    $lastDate = null;
                    $lastVendor = null;
                    $ccPendingTransactionDate = null;
                    $ccPendingVendor = null;
                    continue;
                }

                // Google Vision often extracts this TD table by columns/cells:
                // OCT 28 / OCT 31 / FIORIO YORKVILLE TORONTO / $46.33
                // This block buffers those cell lines and emits one transaction when the amount is reached.
                if ($this->isCcDateOnlyLine($line)) {
                    if ($ccPendingTransactionDate === null || $ccPendingVendor !== null) {
                        $ccPendingTransactionDate = $this->normalizeDate($line, $statementYear);
                        $ccPendingVendor = null;
                    }
                    // If this is the posting-date cell, ignore it. We keep the first date as transaction date.
                    continue;
                }

                if ($this->isCcAmountOnlyLine($line)) {
                    $rawAmount = $line;
                    $hasCurrencySign = str_contains($rawAmount, '$');
                    $amount = $this->parseAmount($rawAmount, $hasCurrencySign);
                    $vendorToUse = trim((string) $ccPendingVendor);

                    if ($ccPendingTransactionDate
                        && $vendorToUse !== ''
                        && $amount !== null
                        && $amount > 0.01
                        && !$this->isCreditCardPaymentOrCreditRow($vendorToUse, $rawAmount)
                        && $this->isLikelyTransaction($vendorToUse, $amount, true)) {
                        $expenses[] = $this->makeExpense($ccPendingTransactionDate, $vendorToUse, $amount);
                        Log::info("[Extractor] Parsed split CC row: date=$ccPendingTransactionDate, vendor=$vendorToUse, amount=$amount");
                    } else {
                        Log::debug("[Extractor] Split CC amount ignored: date=$ccPendingTransactionDate, vendor=$vendorToUse, amount=$amount, raw=$rawAmount");
                    }

                    $ccPendingTransactionDate = null;
                    $ccPendingVendor = null;
                    $lastDate = null;
                    $lastVendor = null;
                    continue;
                }

                if (preg_match('/PREVIOUS\s+STATEMENT\s+BALANCE/i', $line)) {
                    $ccPendingTransactionDate = null;
                    $ccPendingVendor = null;
                    continue;
                }

                // Vendor cell. Keep appending only until amount appears.
                if ($ccPendingTransactionDate !== null && !preg_match(self::AMOUNT_REGEX, $line) && $this->isLikelyTransaction($line, 1.0, true)) {
                    $ccPendingVendor = trim(trim((string) $ccPendingVendor . ' ' . $line));
                    continue;
                }

                Log::debug("[Extractor] Skipping non-transaction line inside table: $line");
                continue;
            }
            
            // Clean noise words that often appear in footers or headers but contain numbers
            if (!$insideTransactionTable && preg_match('/(?:Call|Phone|www\.|http|Fax|Tel|Address|Member|FDIC|Equal Housing|P\.O\.\s*BOX|Service|Inquiries|TTY|Points|Reward|Earned|Bonus|Number)/i', $line)) {
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
                if (preg_match_all(self::AMOUNT_REGEX, $line, $summaryMatches, PREG_SET_ORDER)) {
                    // Try to find the first likely balance amount in a summary line
                    foreach ($summaryMatches as $m) {
                        $hasSign = str_contains($m[0], '$');
                        $parsed = $this->parseAmount($m[1], $hasSign);
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
            $allLineDateMatches = [];
            if (preg_match_all(self::DATE_REGEX, $line, $dateMatches, PREG_SET_ORDER)) {
                foreach ($dateMatches as $dm) {
                    $norm = $this->normalizeDate($dm[1], $statementYear);
                    if ($norm) {
                        if (!$foundDate) $foundDate = $norm;
                        $allLineDateMatches[] = ['raw' => $dm[0], 'norm' => $norm];
                    }
                }
            }
            
            if (!$foundDate && preg_match(self::FALLBACK_DATE_REGEX, $line, $dateMatches) && strlen($line) < 30) {
                $foundDate = $this->normalizeDate($dateMatches[1], $statementYear);
                if ($foundDate) {
                    Log::debug("[Extractor] Found fallback date: $foundDate from $dateMatches[1]");
                    $allLineDateMatches[] = ['raw' => $dateMatches[0], 'norm' => $foundDate];
                }
            }

            if (preg_match_all(self::AMOUNT_REGEX, $line, $amountMatches, PREG_SET_ORDER)) {
                $nonZeroMatches = array_filter($amountMatches, function($m) {
                    $hasSign = str_contains($m[0], '$');
                    $val = $this->parseAmount($m[1], $hasSign);
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
                        // Credit card transaction-table rows normally have the actual transaction amount at the end.
                        // This avoids choosing store/location numbers or reference numbers as the amount.
                        if ($this->isCreditCardStyle && $insideTransactionTable) {
                            $lastAmountMatch = end($nonZeroMatches);
                            $hasSign = str_contains($lastAmountMatch[0], '$');
                            $amount = $this->parseAmount($lastAmountMatch[1], $hasSign);
                        } else {
                            // Score matches to find the most likely transaction amount
                            $bestAmountIdx = 0;
                            $bestScore = -1;
                            $parsedAmounts = [];
                        
                            foreach ($nonZeroMatches as $idx => $m) {
                            $hasSign = str_contains($m[0], '$');
                            $hasDecimal = str_contains($m[1], '.');
                            $val = $this->parseAmount($m[1], $hasSign);
                            $parsedAmounts[$idx] = $val;
                            
                            $score = 0;
                            if ($hasSign) $score += 10;
                            if ($hasDecimal) $score += 5;
                            
                            // Prefer amounts earlier in the line for transaction amount, 
                            // as balance is usually at the end.
                            $score -= $idx * 2; 

                            if ($score > $bestScore) {
                                $bestScore = $score;
                                $bestAmountIdx = $idx;
                            }
                        }

                        $transactionAmount = $parsedAmounts[$bestAmountIdx];
                        
                        // Look for a balance (usually the last amount if different from transaction)
                        $lastIdx = count($nonZeroMatches) - 1;
                        if ($lastIdx !== $bestAmountIdx) {
                            $foundBalance = $parsedAmounts[$lastIdx];
                        }
                        
                        // Check if this was a credit or debit based on balance change
                        if ($this->runningBalance !== null && $foundBalance !== null) {
                            $diff = $foundBalance - $this->runningBalance;
                            
                            if ($this->isCreditCardStyle) {
                                if ($diff > 0.0001) $isCredit = false;
                                elseif ($diff < -0.0001) $isCredit = true;
                            } else {
                                if ($diff > 0.0001) $isCredit = true;
                                elseif ($diff < -0.0001) $isCredit = false;
                            }

                            // Use balance change to correct amount if it matches any of the parsed amounts better
                            $absDiff = abs($diff);
                            foreach ($parsedAmounts as $pa) {
                                if ($pa !== null && abs($pa - $absDiff) < 0.005) {
                                    $transactionAmount = $pa;
                                    break;
                                }
                            }
                        }
                        
                            if ($foundBalance !== null) {
                                $this->runningBalance = $foundBalance;
                            }
                            $amount = $transactionAmount;
                        }
                    } else {
                        // Single amount
                        $hasSign0 = str_contains($nonZeroMatches[0][0], '$');
                        $amount = $this->parseAmount($nonZeroMatches[0][1], $hasSign0);
                    }

                    // Check for signs in the raw amount string - plus usually means credit/money in
                    $rawAmount0 = $nonZeroMatches[0][1];
                    if (str_contains($rawAmount0, '+')) {
                        $isCredit = true;
                    }

                    // Check for explicit CR/DR markers
                    if (!$isCredit && isset($nonZeroMatches[0][2])) {
                        $marker = strtoupper($nonZeroMatches[0][2]);
                        if ($marker === 'CR') $isCredit = true;
                        elseif ($marker === 'DR') $isCredit = false;
                    }

                    // Credit keywords
                    if (!$isCredit) {
                        $lowerLine = strtolower($line);
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

                    if ($amount !== null && $amount > 0.01) {
                        $dateToUse = $foundDate ?: $lastDate;
                        
                        $allAmountsInLine = array_column($amountMatches, 0);
                        $dateStrForVendor = !empty($allLineDateMatches) ? $allLineDateMatches[0]['raw'] : '';
                        $vendorToUse = $this->extractVendor($line, $dateStrForVendor, $allAmountsInLine);
                        
                        if (empty($vendorToUse) && $lastVendor) {
                            $vendorToUse = $lastVendor;
                        }

                        if ($amount && !empty($vendorToUse) && $this->isLikelyTransaction($vendorToUse, $amount)) {
                            if (!$dateToUse) continue;
                            
                            if ($isCredit && !$this->isCreditCardStyle) {
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
                            
                            $lastDate = null;
                            $lastVendor = null;
                            continue;
                        }
                    }
                }
            }

            if ($foundDate) {
                // Buffer the date. For statements with two dates (Transaction & Posting), 
                // the first one seen is usually the transaction date.
                if (!$lastDate) {
                    $lastDate = $foundDate;
                }
                
                $dateStrForVendor = !empty($allLineDateMatches) ? $allLineDateMatches[0]['raw'] : '';
                $vendorStart = trim(str_replace($dateStrForVendor, '', $line));
                if (!empty($vendorStart) && $this->isLikelyTransaction($vendorStart, 1.0)) {
                    $lastVendor = $vendorStart;
                }
            } elseif (!empty($line) && !$foundDate && !$lastVendor) {
                if ($this->isLikelyTransaction($line, 1.0)) {
                    $lastVendor = $line;
                }
            }
        }

        // Deduplicate regular bank-statement parsing, but keep duplicate credit-card table rows.
        // Credit-card statements can legitimately have two identical purchases on the same date/vendor/amount.
        if (!($this->isCreditCardStyle && $transactionTableModeDetected)) {
            $expenses = $this->deduplicate($expenses);
        }

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



    private function makeExpense(string $date, string $vendor, float $amount): array
    {
        return [
            'transaction_date' => $date,
            'vendor_name' => $vendor,
            'expense_amount' => number_format($amount, 2, '.', ''),
            'buyer_name' => '',
            'transaction_desc' => $vendor,
            'transaction_notes' => '',
            'project_id' => null,
            'cost_centre_id' => null,
            'account_number_id' => null,
        ];
    }

    private function isCcDateOnlyLine(string $line): bool
    {
        $line = trim($this->normalizeOcrLine($line));
        return (bool) preg_match('/^(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*\s*\d{1,2}$/i', $line)
            || (bool) preg_match('/^\d{1,2}[\/\-\.]\d{1,2}(?:[\/\-\.]\d{2,4})?$/', $line);
    }

    private function isCcAmountOnlyLine(string $line): bool
    {
        $line = trim($line);
        return (bool) preg_match('/^[+-]?\s*\$?\s*\d{1,3}(?:,\d{3})*\.\d{2}\s*(?:DR|CR)?$/i', $line)
            || (bool) preg_match('/^\$\s*[+-]?\s*\d{1,6}(?:,\d{3})?\.\d{2}\s*(?:DR|CR)?$/i', $line);
    }

    private function isCreditCardPaymentOrCreditRow(string $vendor, string $rawAmount): bool
    {
        $upperVendor = strtoupper(trim($vendor));
        $compactAmount = str_replace([' ', ','], '', $rawAmount);

        // Negative rows on credit-card statements are payments/credits/refunds, not expenses.
        if (str_contains($compactAmount, '-')) {
            return true;
        }

        $paymentKeywords = [
            'PAYMENT-THANK YOU',
            'PAYMENT THANK YOU',
            'PAYMENT RECEIVED',
            'ONLINE PAYMENT',
            'MOBILE PAYMENT',
            'AUTH PAYMENT',
            'THANK YOU',
            'REFUND',
            'REVERSAL',
            'CREDIT',
            'ADJUSTMENT'
        ];

        foreach ($paymentKeywords as $keyword) {
            if (str_contains($upperVendor, $keyword)) {
                return true;
            }
        }

        return false;
    }

    private function parseTdBusinessTravelVisa(string $text, ?int $statementYear): array
    {
        $expenses = [];
        $refunds = [];

        $pendingExpenseIndex = null;
        $insideTransactionTable = true; // TD OCR can split/miss the table header, so scan all lines and only accept strict TD rows.
        $rowBuffer = '';

        $lines = array_values(array_filter(array_map(function ($line) {
            return $this->normalizeOcrLine(trim($line));
        }, explode("\n", $text)), function ($line) {
            return $line !== '';
        }));

        foreach ($lines as $line) {
            $upperLine = strtoupper($line);

            if ($this->isTransactionTableHeader($upperLine)) {
                $insideTransactionTable = true;
                $pendingExpenseIndex = null;
                $rowBuffer = '';
                continue;
            }

            // For TD statements, do not require a table header. Vision OCR can split the header
            // across multiple lines. We safely scan all lines because parseTdBusinessTravelVisaRow()
            // only accepts rows with two TD-style dates + vendor + final CAD amount.
            if ($this->isTdTransactionTableEnd($upperLine)) {
                $pendingExpenseIndex = null;
                $rowBuffer = '';
                continue;
            }

            if ($this->isTdTransactionNoiseLine($upperLine)) {
                // Do not let side-panel / foreign-currency note lines pollute the next transaction.
                if ($this->shouldResetTdBufferForNoise($upperLine)) {
                    $rowBuffer = '';
                    $pendingExpenseIndex = null;
                }
                continue;
            }

            // Handle vendor continuation lines after a completed row, for example:
            // WAL-MART SUPERCENTER#1118 / STITTSVILLE
            // GOOGLE*CLOUD WD55WJ CC / GOOGLE.CO
            if ($rowBuffer === '' && $pendingExpenseIndex !== null && $this->isValidTdContinuationLine($line)) {
                $currentVendor = $expenses[$pendingExpenseIndex]['vendor_name'];
                $newVendor = trim($currentVendor . ' ' . $line);
                $newVendor = preg_replace('/\s+/', ' ', $newVendor);

                $expenses[$pendingExpenseIndex]['vendor_name'] = $newVendor;
                $expenses[$pendingExpenseIndex]['transaction_desc'] = $newVendor;
                continue;
            }

            // If a new transaction date starts while the previous buffer never became a valid row,
            // discard the stale buffer. This prevents marketing/side-panel text from joining a real row.
            if ($rowBuffer !== '' && $this->tdLineStartsWithDate($line) && !$this->tdBufferLooksIncompleteDateOnly($rowBuffer)) {
                $rowBuffer = '';
            }

            // Build rows from either normal one-line PDF text:
            // OCT 8 OCT 9 DOLLARAMA # 784 STITTSVILLE $43.79
            // or cell-by-cell / broken month text:
            // NOV / 1 NOV / 3 GOOGLE *CLOUD ... $53.62
            $candidate = trim($rowBuffer . ' ' . $line);
            $candidate = preg_replace('/\s+/', ' ', $candidate);
            $row = $this->parseTdBusinessTravelVisaRow($candidate, $statementYear);

            if ($row !== null) {
                if ($this->isCreditCardPaymentOrCreditRow($row['vendor'], $row['raw_amount'])) {
                    $refunds[] = $this->makeExpense($row['date'], $row['vendor'], $row['amount']);
                    $pendingExpenseIndex = null;
                } else {
                    $expenses[] = $this->makeExpense($row['date'], $row['vendor'], $row['amount']);
                    $pendingExpenseIndex = array_key_last($expenses);
                }

                $rowBuffer = '';
                continue;
            }

            // Keep buffering only if the line can reasonably be part of a TD transaction row.
            if ($this->isPotentialTdRowPiece($line, $rowBuffer)) {
                $rowBuffer = $candidate;
            } else {
                $rowBuffer = '';
            }
        }

        // Do NOT deduplicate TD card expenses. Same vendor/date/amount can be valid separate purchases.
        $refunds = $this->deduplicate($refunds);

        return [
            'expenses' => $expenses,
            'refunds' => $refunds,
            'count' => count($expenses),
            'paired' => 0,
            'account_number' => $this->extractTdAccountNumber($text),
        ];
    }

    private function parseTdBusinessTravelVisaRow(string $line, ?int $statementYear): ?array
    {
        $line = $this->normalizeOcrLine(trim($line));
        $line = preg_replace('/\s+/', ' ', $line);

        if ($line === '') {
            return null;
        }

        $monthToken = '(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)';
        $dateToken = $monthToken . '\s*\d{1,2}';
        $amountToken = '(-?\$?\s*\d{1,3}(?:,\d{3})*\.\d{2}|-?\$?\s*\d+\.\d{2})';

        // Strict TD row: transaction date + posting date + vendor + final CAD amount.
        // Requiring two dates is what prevents side-panel rows like "Nov. 26, 2025 $325.22"
        // or rewards rows like "Promotions & Adjustments" from becoming transactions.
        $pattern = '/^\s*(' . $dateToken . ')\s+(' . $dateToken . ')\s+(.+?)\s+' . $amountToken . '\s*$/i';

        if (!preg_match($pattern, $line, $m)) {
            return null;
        }

        $transactionDate = $this->normalizeDate($m[1], $statementYear);
        if (!$transactionDate) {
            return null;
        }

        $vendor = trim(preg_replace('/\s+/', ' ', $m[3]));
        $vendor = trim($vendor, " \t\n\r\0\x0B-_.,;:/\\$|");

        if ($vendor === '' || $this->isInvalidTdVendor($vendor)) {
            return null;
        }

        $rawAmount = $m[4];
        $hasCurrencySign = str_contains($rawAmount, '$');
        $amount = $this->parseAmount($rawAmount, $hasCurrencySign);

        if ($amount === null || $amount <= 0.01) {
            return null;
        }

        return [
            'date' => $transactionDate,
            'vendor' => $vendor,
            'amount' => $amount,
            'raw_amount' => $rawAmount,
        ];
    }

    private function tdLineStartsWithDate(string $line): bool
    {
        return (bool) preg_match('/^\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)\s*\d{1,2}\b/i', $line);
    }

    private function tdBufferLooksIncompleteDateOnly(string $buffer): bool
    {
        $buffer = trim(preg_replace('/\s+/', ' ', $buffer));

        // Examples that should continue buffering:
        // "NOV"
        // "NOV 1"
        // "NOV 1 NOV"
        // "OCT 8 OCT 9"
        return (bool) preg_match('/^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)(\s+\d{1,2})?(\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC))?(\s+\d{1,2})?$/i', $buffer);
    }

    private function isPotentialTdRowPiece(string $line, string $currentBuffer = ''): bool
    {
        $line = trim($this->normalizeOcrLine($line));
        $upperLine = strtoupper($line);

        if ($line === '') {
            return false;
        }

        if ($this->isTdTransactionNoiseLine($upperLine) || $this->isInvalidTdVendor($line)) {
            return false;
        }

        if (preg_match('/TRANSACTION|POSTING|ACTIVITY|DESCRIPTION|STATEMENT|ACCOUNT\s+NUMBER|PAYMENT\s+DUE|BALANCE|CONTACT|INFORMATION|INSURANCE|VISIT\s+WWW|TERMS\s+APPLY/i', $upperLine)) {
            return false;
        }

        // Month-only and date cells are valid pieces in Vision/Smalot broken layouts.
        if (preg_match('/^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)$/i', $line)) {
            return true;
        }

        if (preg_match('/^\d{1,2}\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)$/i', $line)) {
            return true;
        }

        if ($this->tdLineStartsWithDate($line)) {
            return true;
        }

        // Vendor or amount can be part of a row only after we already captured a date piece.
        if ($currentBuffer !== '' && preg_match('/(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)/i', $currentBuffer)) {
            if ($this->isCcAmountOnlyLine($line)) {
                return true;
            }

            if (!preg_match(self::AMOUNT_REGEX, $line) && preg_match('/[A-Z]{2,}/i', $line)) {
                return true;
            }
        }

        return false;
    }

    private function shouldResetTdBufferForNoise(string $upperLine): bool
    {
        return (bool) preg_match('/PROMOTIONS\s+&\s+ADJUSTMENTS|PAYMENT\s+DUE|MINIMUM\s+PAYMENT|CREDIT\s+LIMIT|AVAILABLE\s+CREDIT|CALCULATING\s+YOUR\s+BALANCE|TOTAL\s+TD\s+REWARDS|PREVIOUS\s+TD\s+REWARDS|EARNED\s+THIS\s+STATEMENT/i', $upperLine);
    }

    private function isTdTransactionTableEnd(string $upperLine): bool
    {
        return (bool) preg_match('/^TOTAL\s+NEW\s+BALANCE\b|^TD\s+MESSAGE\s+CENTRE\b/i', $upperLine);
    }

    private function isTdTransactionNoiseLine(string $upperLine): bool
    {
        return (bool) preg_match('/PREVIOUS\s+STATEMENT\s+BALANCE/i', $upperLine)
            || (bool) preg_match('/^CONTINUED$/i', $upperLine)
            || (bool) preg_match('/FOREIGN\s+CURRENCY/i', $upperLine)
            || (bool) preg_match('/EXCHANGE\s+RATE/i', $upperLine)
            || (bool) preg_match('/^\.?$/', $upperLine);
    }

    private function isInvalidTdVendor(string $vendor): bool
    {
        $upperVendor = strtoupper(trim($vendor));

        $invalidPatterns = [
            '/PROMOTIONS\s+&\s+ADJUSTMENTS/',
            '/PAYMENT\s+DUE\s+DATE/',
            '/MINIMUM\s+PAYMENT/',
            '/CREDIT\s+LIMIT/',
            '/AVAILABLE\s+CREDIT/',
            '/ANNUAL\s+INTEREST/',
            '/CALCULATING\s+YOUR\s+BALANCE/',
            '/AMOUNT\(S\)/',
            '/WAIT\.\s+PLAN/',
            '/FOR\s+THE\s+FUTURE/',
            '/LIFE\s+DOESN/',
            '/TD\s+REWARDS/',
            '/CUSTOMER\s+SERVICE/',
            '/CONTACT\s+INFORMATION/',
            '/NEW\s+BALANCE/',
            '/PREVIOUS\s+BALANCE/',
            '/PAYMENTS\s+&\s+CREDITS/',
            '/PURCHASES\s+&\s+OTHER\s+CHARGES/',
            '/CASH\s+ADVANCES/',
            '/SUB-TOTAL/',
        ];

        foreach ($invalidPatterns as $pattern) {
            if (preg_match($pattern, $upperVendor)) {
                return true;
            }
        }

        // Vendor cannot be only a date like "Nov. 26, 2025".
        if (preg_match('/^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*\.?\s+\d{1,2},?\s+20\d{2}$/i', $vendor)) {
            return true;
        }

        return false;
    }

    private function isValidTdContinuationLine(string $line): bool
    {
        $line = trim($this->normalizeOcrLine($line));
        $upperLine = strtoupper($line);

        if ($line === '') {
            return false;
        }

        if (strlen($line) > 45) {
            return false;
        }

        if (preg_match('/^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)\b/i', $line)) {
            return false;
        }

        if (preg_match(self::AMOUNT_REGEX, $line)) {
            return false;
        }

        if ($this->isTdTransactionNoiseLine($upperLine) || $this->isInvalidTdVendor($line)) {
            return false;
        }

        if (preg_match('/TRANSACTION|POSTING|ACTIVITY|DESCRIPTION|STATEMENT|ACCOUNT\s+NUMBER|PAYMENT|BALANCE|CONTACT|INFORMATION|INSURANCE|VISIT\s+WWW|SAVE\s+WITH|TERMS\s+APPLY/i', $upperLine)) {
            return false;
        }

        return (bool) preg_match('/[A-Z]{2,}/i', $line);
    }

    private function extractTdAccountNumber(string $text): ?string
    {
        if (preg_match('/Account Number:\s*([0-9Xx\s]+\d{4})/i', $text, $m)) {
            return trim(preg_replace('/\s+/', ' ', $m[1]));
        }

        if (preg_match('/TD\s+BUSINESS\s+TRAVEL\s+VISA\s+CARD\s*\n?\s*Account Number:\s*([0-9Xx\s]+\d{4})/i', $text, $m)) {
            return trim(preg_replace('/\s+/', ' ', $m[1]));
        }

        return null;
    }

    private function parseCreditCardTransactionTableRow(string $line, ?int $statementYear): ?array
    {
        $line = $this->normalizeOcrLine(trim($line));
        if ($line === '') return null;

        // Skip table-only and summary rows.
        if ($this->isTransactionTableHeader(strtoupper($line)) || $this->isTransactionTableEnd(strtoupper($line))) {
            return null;
        }

        if (preg_match('/PREVIOUS\s+STATEMENT\s+BALANCE/i', $line)) {
            Log::info("[Extractor] Skipping previous statement balance row: $line");
            return null;
        }

        // Match a credit-card row with transaction date + posting date + description + final amount.
        // Month tokens intentionally allow OCR-normalized compact dates like OCT29 and spaced dates like OCT 29.
        $monthToken = '(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*';
        $dateToken = '(?:\d{1,2}[\/\-\.]\d{1,2}(?:[\/\-\.]\d{2,4})?|' . $monthToken . '\s*\d{1,2})';
        $amountToken = '([+-]?\s*\$?\s*\d{1,3}(?:,\d{3})*\.\d{2}|[+-]?\s*\$?\s*\d+\.\d{2}|\$[+-]?\s*\d{1,6}(?:,\d{3})?[\.\,]\d{2})';

        // More flexible pattern to handle varying number of spaces and optional posting date
        $pattern = '/^\s*(' . $dateToken . ')\s+(?:' . $dateToken . '\s+)?(.+?)\s+' . $amountToken . '\s*(?:DR|CR|[\W_])?\s*$/i';
        if (!preg_match($pattern, $line, $m)) {
            Log::debug("[Extractor] Row did not match CC transaction pattern: $line");
            return null;
        }

        $transactionDate = $this->normalizeDate($m[1], $statementYear);
        if (!$transactionDate) {
            Log::warning("[Extractor] Failed to normalize date '{$m[1]}' from row: $line");
            return null;
        }

        $vendor = trim($m[2]);
        $vendor = preg_replace('/\s+/', ' ', $vendor);
        $vendor = trim($vendor, " \t\n\r\0\x0B-_.,;:/\\$|");

        $hasCurrencySign = str_contains($m[3], '$');
        $amount = $this->parseAmount($m[3], $hasCurrencySign);

        Log::info("[Extractor] Parsed CC row: date=$transactionDate, vendor=$vendor, amount=$amount");

        if ($vendor === '' || $amount === null) return null;

        return [
            'date' => $transactionDate,
            'vendor' => $vendor,
            'amount' => $amount,
            'raw_amount' => $m[3],
        ];
    }

    private function isLikelyTransaction(string $vendor, float $amount, bool $fromTransactionTable = false): bool
    {
        $vendor = trim($vendor);
        if (empty($vendor)) return false;

        $upperVendor = strtoupper($vendor);

        // Always allow known common expense vendors
        if (preg_match('/AMAZON|UBER|LYFT|STARBUCKS|WALMART|SHELL|PETRO|APPLE|GOOGLE|MICROSOFT|ADOBE|NETFLIX|SPOTIFY|ZOOM|SLACK|FIGMA/i', $upperVendor)) {
            return true;
        }

        // Avoid things that look like common date formats
        if (preg_match('/^\d{1,2}[\.\/]\d{1,2}[\.\/]\d{2,4}$/', $vendor)) return false;
        
        // For credit cards, be more lenient with short vendor names
        if ($this->isCreditCardStyle) {
            if (strlen($vendor) < 2) return false;
        } else {
            if (strlen($vendor) < 3) return false;
        }

        // Common non-vendor words in long strings
        $noise = ['PROCESSING', 'TRANSACTIONS', 'PENDING', 'ORDER', 'BEGAN', 'BALANCE', 'SUMMARY', 'STATEMENT', 'CONTINUED', 'IMPORTANT', 'INFORMATION'];
        
        // Avoid single words that are just months
        $months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JAN', 'FEB', 'MAR', 'APR', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        if (in_array($upperVendor, $months)) return false;

        // More noise patterns
        if (preg_match('/(?:WWW\.|HTTP|@|\bYEAR\(S\)\b|\bMONTH\(S\)\b)/i', $upperVendor)) return false;

        // If it's a credit card, we are slightly less strict about noise keywords 
        // as descriptions can be weird, but we still filter out common junk.
        $junkPatterns = [
            '/YEAR\(S\)/i',
            '/MONTH\(S\)/i',
            '/STATEMENT\s+DATE/i',
            '/PAYMENT\s+DUE/i',
            '/CREDIT\s+LIMIT/i',
            '/AVAILABLE\s+CREDIT/i',
            '/ANNUAL\s+INTEREST/i',
            '/ESTIMATED\s+TIME/i',
            '/NEW\s+BALANCE/i',
            '/MINIMUM\s+PAYMENT/i',
            '/PREVIOUS\s+BALANCE/i',
            '/PAYMENTS\s+&\s+CREDITS/i',
            '/PURCHASES\s+&\s+CHARGES/i',
            '/CASH\s+ADVANCES/i',
            '/FEES/i',
            '/INTEREST/i',
            '/POINTS\s+EARNED/i',
            '/BONUS\s+POINTS/i',
            '/TOTAL\s+POINTS/i',
            '/CUSTOMER\s+SERVICE/i',
            '/AEROPLAN\s+NUMBER/i',
            '/NET\s+AMOUNT/i',
            '/MONTHLY\s+ACTIVITY/i',
        ];

        foreach ($junkPatterns as $pattern) {
            if (preg_match($pattern, $upperVendor)) return false;
        }

        // Avoid strings that are mostly numbers and special chars
        if (preg_match('/^[\d\s\W_]+$/', $vendor) && !preg_match('/[A-Z]{2,}/i', $vendor)) {
            return false;
        }

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
        // Remove extra spaces within the date string (e.g., "06 / 19 / 2026" -> "06/19/2026")
        $raw = preg_replace('/\s*([\/\-\.])\s*/', '$1', $raw);
        $raw = preg_replace('/\s+/', ' ', $raw);

        // Handle compact month formats like OCT29, OCT31, NOV1.
        // DateTime::createFromFormat can sometimes produce unexpected results when OCR text is messy,
        // so parse these manually before using generic date formats.
        if (preg_match('/^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*\s*(\d{1,2})$/i', $raw, $monthMatch)) {
            $monthMap = [
                'JAN' => 1, 'FEB' => 2, 'MAR' => 3, 'APR' => 4, 'MAY' => 5, 'JUN' => 6,
                'JUL' => 7, 'AUG' => 8, 'SEP' => 9, 'SEPT' => 9, 'OCT' => 10, 'NOV' => 11, 'DEC' => 12,
            ];
            $monKey = strtoupper(substr($monthMatch[1], 0, 4)) === 'SEPT' ? 'SEPT' : strtoupper(substr($monthMatch[1], 0, 3));
            $month = $monthMap[$monKey] ?? null;
            $day = (int) $monthMatch[2];
            $year = $statementYear ?: (int) date('Y');
            if ($month && checkdate($month, $day, $year)) {
                return sprintf('%04d-%02d-%02d', $year, $month, $day);
            }
        }

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
            $shortFormats = [
                'm d', 'd m', 'M d', 'd M', 'F d', 'd F', 'm/d', 'd/m',
                'Md', 'dM', 'Fd', 'dF', 'md'
            ];
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

    private function parseAmount(string $text, bool $hasCurrencySign = false): ?float
    {
        $raw = $text;
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
        
        if ($cleaned === '') return null;
        $val = (float)$cleaned;

        // Filtering noise:
        // 1. Single or double digit integers without a decimal point are often not amounts (page nums, dates, etc)
        // unless they have a $ sign.
        if (floor($val) == $val && $val < 100 && !str_contains($text, '.')) {
            if (!$hasCurrencySign && $val < 10) return null; 
        }

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
        
        // Remove ANY other dates that might be in the line (common in statements with two dates per line)
        $line = preg_replace(self::DATE_REGEX, ' ', $line);

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
            '/\bAEROPLAN\b/i',
            '/\bINFINITE\b/i',
            '/\bPRIVILEGE\b/i',
        ];
        $line = preg_replace($markers, ' ', $line);

        // Common bank-specific noise that shouldn't be part of vendor names
        $bankNoise = [
            '/TD\s+Bank/i',
            '/TD\s+Convenience/i',
            '/Checking/i',
            '/Account\s*#\s*\d+/i',
            '/Statement\s+Period/i',
            '/America\'s\s+Most\s+Convenient\s+Bank/i',
            '/TD\s+CANADA\s+TRUST/i'
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
