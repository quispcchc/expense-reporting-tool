<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;
use Smalot\PdfParser\Parser;
use Google\Cloud\Vision\V1\Client\ImageAnnotatorClient;
use Google\Cloud\Vision\V1\AnnotateImageRequest;
use Google\Cloud\Vision\V1\BatchAnnotateImagesRequest;
use Google\Cloud\Vision\V1\Feature;
use Google\Cloud\Vision\V1\Feature\Type;
use Google\Cloud\Vision\V1\Image;
use PhpOffice\PhpWord\IOFactory;

class BankStatementExtractor
{
    private const DATE_REGEX = '/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-]\d{2}[\/\-]\d{2}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:\s+\d{4})?|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:,?\s+\d{4})?)\b/i';
    private const AMOUNT_REGEX = '/(?<![0-9,.])\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+\.\d{1,2})\s*(DR|CR)?(?![0-9,.])/i';
    private const YEAR_REGEX = '/\b(20\d{2})\b/';
    
    public function extract(string $filePath, string $mimeType): array
    {
        $text = $this->extractText($filePath, $mimeType);
        if (empty($text)) {
            return ['expenses' => [], 'refunds' => [], 'paired' => 0];
        }

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
                return $this->extractFromImage($filePath);
            }
            
            return $text;
        } catch (Exception $e) {
            Log::warning('Smalot PDF parser failed, falling back to Vision API', ['error' => $e->getMessage()]);
            return $this->extractFromImage($filePath);
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
        $statementYear = $this->extractStatementYear($text);

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            // Simple heuristic-based extraction for multiple formats
            // This is a simplified version of the complex Python logic
            if (preg_match(self::DATE_REGEX, $line, $dateMatches)) {
                $date = $this->normalizeDate($dateMatches[1], $statementYear);
                if (!$date) continue;

                if (preg_match_all(self::AMOUNT_REGEX, $line, $amountMatches, PREG_SET_ORDER)) {
                    // Usually the last amount on the line is the transaction amount
                    $lastMatch = end($amountMatches);
                    $amount = $this->parseAmount($lastMatch[1]);
                    $isCredit = (isset($lastMatch[2]) && strtoupper($lastMatch[2]) === 'CR') || str_contains($line, '-');

                    // Extract vendor name - everything between date and amount
                    $vendor = $this->extractVendor($line, $dateMatches[0], $lastMatch[0]);
                    
                    if ($date && $amount && !empty($vendor)) {
                        $item = [
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

                        if ($isCredit) {
                            $refunds[] = $item;
                        } else {
                            $expenses[] = $item;
                        }
                    }
                }
            }
        }

        // Deduplicate and pair refunds (similar to Python logic)
        $expenses = $this->deduplicate($expenses);
        [$remainingExpenses, $unmatchedRefunds, $pairedCount] = $this->pairRefunds($expenses, $refunds);

        return [
            'expenses' => $remainingExpenses,
            'refunds' => $unmatchedRefunds,
            'paired' => $pairedCount,
        ];
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
            $shortFormats = ['d M', 'd F', 'M d', 'F d', 'd/m', 'm/d'];
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
        $val = (float)$cleaned;
        return ($val > 0 && $val < 1000000) ? $val : null;
    }

    private function extractVendor(string $line, string $dateStr, string $amountStr): string
    {
        $line = str_replace($dateStr, '', $line);
        $line = str_replace($amountStr, '', $line);
        $line = trim($line, " \t\n\r\0\x0B-_.,;:/\\$");
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
