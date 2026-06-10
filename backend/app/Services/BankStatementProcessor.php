<?php

namespace App\Services;

use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Mpdf\Mpdf;
use Mpdf\Output\Destination;
use Throwable;

/**
 * Accepts a bank statement upload (PDF or image) and returns a stored PDF.
 *
 * Anything that isn't already a PDF is rendered onto a single PDF page with
 * Mpdf so that downstream code can treat every bank statement as a PDF.
 */
class BankStatementProcessor
{
    private const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    private const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    private const DOC_EXTENSIONS = ['doc', 'docx'];

    public const ALLOWED_VALIDATION_MIMES = 'pdf,jpg,jpeg,png,gif,webp,doc,docx';

    /**
     * Store an uploaded bank statement on the public disk and return the
     * relative storage path. PDFs and images are normalised to PDF.
     * Word documents are converted to PDF when LibreOffice is available;
     * otherwise they are stored as-is so the file isn't lost.
     *
     * @throws Exception when the file type is not supported or conversion fails
     */
    public static function storeAsPdf(UploadedFile $file, string $directory = 'bank_statements'): string
    {
        $mime = strtolower((string) $file->getMimeType());
        $ext = strtolower($file->getClientOriginalExtension());

        if ($mime === 'application/pdf' || $ext === 'pdf') {
            return $file->store($directory, 'public');
        }

        if (in_array($mime, self::IMAGE_MIMES, true) || in_array($ext, self::IMAGE_EXTENSIONS, true)) {
            return self::convertImageToPdf($file, $directory);
        }

        if (in_array($ext, self::DOC_EXTENSIONS, true) || str_contains($mime, 'wordprocessingml') || $mime === 'application/msword') {
            return self::convertDocToPdf($file, $directory);
        }

        throw new Exception(
            "Unsupported bank statement file type ({$mime}). Allowed: PDF, JPEG, PNG, GIF, WebP, DOC, DOCX."
        );
    }

    /**
     * Ensure the upload is available as a PDF on disk and return an absolute
     * file path suitable for downstream tools like pdfplumber.
     *
     * PDFs are returned at their existing upload temp path (the second tuple
     * value `false` signals "not a temp PDF we created").
     * Anything else is converted into a temp PDF under storage/app/tmp; the
     * caller should unlink the path when done. The second value `true`
     * indicates the path is a transient file owned by the caller.
     *
     * @return array{0:string,1:bool}
     *
     * @throws Exception when the file type is not supported or conversion fails
     */
    public static function ensurePdfFile(UploadedFile $file): array
    {
        $mime = strtolower((string) $file->getMimeType());
        $ext = strtolower($file->getClientOriginalExtension());

        if ($mime === 'application/pdf' || $ext === 'pdf') {
            return [(string) $file->getRealPath(), false];
        }

        $tempDir = storage_path('app/tmp/bank_statements');
        if (! is_dir($tempDir) && ! mkdir($tempDir, 0775, true) && ! is_dir($tempDir)) {
            throw new Exception('Failed to create temp directory for PDF conversion.');
        }
        $tempPdf = $tempDir.'/'.Str::random(12).'.pdf';

        if (in_array($mime, self::IMAGE_MIMES, true) || in_array($ext, self::IMAGE_EXTENSIONS, true)) {
            self::renderImageToPdf($file, $tempPdf);

            return [$tempPdf, true];
        }

        if (in_array($ext, self::DOC_EXTENSIONS, true) || str_contains($mime, 'wordprocessingml') || $mime === 'application/msword') {
            self::renderDocToPdf($file, $tempPdf);

            return [$tempPdf, true];
        }

        throw new Exception(
            "Unsupported bank statement file type ({$mime}). Allowed: PDF, JPEG, PNG, GIF, WebP, DOC, DOCX."
        );
    }

    /**
     * Render an uploaded image directly to a given absolute PDF path via Mpdf.
     */
    private static function renderImageToPdf(UploadedFile $image, string $absolutePdfPath): void
    {
        $sourcePath = $image->getRealPath();
        if (! $sourcePath || ! is_readable($sourcePath)) {
            throw new Exception('Uploaded image could not be read for PDF conversion.');
        }

        $mpdfTemp = storage_path('app/mpdf');
        if (! is_dir($mpdfTemp) && ! mkdir($mpdfTemp, 0775, true) && ! is_dir($mpdfTemp)) {
            throw new Exception('Failed to create Mpdf temp directory.');
        }

        try {
            $mpdf = new Mpdf([
                'tempDir' => $mpdfTemp,
                'margin_left' => 10,
                'margin_right' => 10,
                'margin_top' => 10,
                'margin_bottom' => 10,
            ]);
            $mpdf->WriteHTML(sprintf(
                '<div style="text-align:center;"><img src="%s" style="max-width:100%%; max-height:260mm;" /></div>',
                $sourcePath
            ));
            $mpdf->Output($absolutePdfPath, Destination::FILE);
        } catch (Throwable $e) {
            Log::error('Image-to-PDF conversion failed', ['error' => $e->getMessage()]);
            throw new Exception('Could not convert image to PDF: '.$e->getMessage());
        }
    }

    /**
     * Render an uploaded Word document directly to a given absolute PDF path
     * via LibreOffice. Throws if LibreOffice isn't available — extraction
     * cannot continue without a real PDF.
     */
    private static function renderDocToPdf(UploadedFile $doc, string $absolutePdfPath): void
    {
        $sourcePath = $doc->getRealPath();
        if (! $sourcePath || ! is_readable($sourcePath)) {
            throw new Exception('Uploaded document could not be read for PDF conversion.');
        }

        $soffice = self::findSoffice();
        if (! $soffice) {
            throw new Exception('LibreOffice (soffice) is not available on this server; cannot convert document to PDF for extraction.');
        }

        $outputDir = dirname($absolutePdfPath);
        if (! is_dir($outputDir) && ! mkdir($outputDir, 0775, true) && ! is_dir($outputDir)) {
            throw new Exception('Failed to create temp directory for document conversion.');
        }

        // Stage the source with a unique name so soffice's deterministic output
        // filename doesn't clash with sibling requests.
        $workingSrc = $outputDir.'/src-'.Str::random(8).'.'.($doc->getClientOriginalExtension() ?: 'doc');
        if (! copy($sourcePath, $workingSrc)) {
            throw new Exception('Failed to stage document for conversion.');
        }

        try {
            $command = sprintf(
                '%s --headless --convert-to pdf --outdir %s %s 2>&1',
                escapeshellarg($soffice),
                escapeshellarg($outputDir),
                escapeshellarg($workingSrc)
            );
            $output = shell_exec($command);
            Log::info('LibreOffice (extract) conversion output', ['output' => $output]);

            $produced = $outputDir.'/'.pathinfo($workingSrc, PATHINFO_FILENAME).'.pdf';
            if (! file_exists($produced)) {
                throw new Exception('LibreOffice did not produce a PDF. Output: '.trim((string) $output));
            }

            if ($produced !== $absolutePdfPath && ! rename($produced, $absolutePdfPath)) {
                throw new Exception('Failed to move converted PDF to expected location.');
            }
        } catch (Throwable $e) {
            Log::error('Document-to-PDF conversion failed', ['error' => $e->getMessage()]);
            throw new Exception('Could not convert document to PDF: '.$e->getMessage());
        } finally {
            if (file_exists($workingSrc)) {
                @unlink($workingSrc);
            }
        }
    }

    /**
     * Convert an uploaded Word document into a PDF using LibreOffice (soffice).
     * If LibreOffice is not installed on the host, the document is stored as-is
     * so the file isn't lost; the preview UI will fall back to a download link.
     */
    private static function convertDocToPdf(UploadedFile $doc, string $directory): string
    {
        $sourcePath = $doc->getRealPath();
        if (! $sourcePath || ! is_readable($sourcePath)) {
            throw new Exception('Uploaded document could not be read for PDF conversion.');
        }

        $soffice = self::findSoffice();
        if (! $soffice) {
            Log::warning('LibreOffice not available - storing document as-is without PDF conversion.', [
                'file' => $doc->getClientOriginalName(),
            ]);

            return $doc->store($directory, 'public');
        }

        $outputDir = storage_path('app/mpdf/converted');
        if (! is_dir($outputDir) && ! mkdir($outputDir, 0775, true) && ! is_dir($outputDir)) {
            throw new Exception('Failed to create temp directory for document conversion.');
        }

        // soffice copies the source filename and replaces the extension with .pdf
        // in the --outdir. Convert to a unique working copy first so concurrent
        // requests don't collide on the output filename.
        $workingSrc = $outputDir.'/src-'.Str::random(8).'.'.strtolower($doc->getClientOriginalExtension() ?: 'doc');
        if (! copy($sourcePath, $workingSrc)) {
            throw new Exception('Failed to stage document for conversion.');
        }

        try {
            $command = sprintf(
                '%s --headless --convert-to pdf --outdir %s %s 2>&1',
                escapeshellarg($soffice),
                escapeshellarg($outputDir),
                escapeshellarg($workingSrc)
            );
            $output = shell_exec($command);
            Log::info('LibreOffice conversion output', ['output' => $output]);

            $convertedPdf = $outputDir.'/'.pathinfo($workingSrc, PATHINFO_FILENAME).'.pdf';
            if (! file_exists($convertedPdf)) {
                throw new Exception('LibreOffice did not produce a PDF. Output: '.trim((string) $output));
            }

            $base = Str::slug(pathinfo($doc->getClientOriginalName(), PATHINFO_FILENAME) ?: 'bank-statement');
            $relativePath = trim($directory, '/').'/'.$base.'-'.Str::random(8).'.pdf';

            // Store to public disk (which might be GCS)
            \Illuminate\Support\Facades\Storage::disk('public')->put($relativePath, file_get_contents($convertedPdf));

            return $relativePath;
        } catch (Throwable $e) {
            Log::error('Failed to convert document bank statement to PDF', [
                'error' => $e->getMessage(),
                'file' => $doc->getClientOriginalName(),
            ]);
            throw new Exception('Could not convert document to PDF: '.$e->getMessage());
        } finally {
            if (file_exists($workingSrc)) {
                @unlink($workingSrc);
            }
        }
    }

    /**
     * Run ocrmypdf on a PDF in-place. Adds a hidden text layer to image-only
     * pages so pdfplumber can read text from them. Native text PDFs pass
     * through unchanged thanks to --skip-text.
     *
     * Best-effort: failures are logged but do not throw — the caller can
     * still try pdfplumber on the original file.
     */
    public static function ocrPdfInPlace(string $absolutePdfPath): bool
    {
        if (! file_exists($absolutePdfPath)) {
            return false;
        }

        $ocrmypdf = self::findOcrMyPdf();
        if (! $ocrmypdf) {
            Log::warning('ocrmypdf not available - skipping OCR step.');

            return false;
        }

        $outputPath = $absolutePdfPath.'.ocr.pdf';
        $command = sprintf(
            '%s --skip-text --quiet %s %s 2>&1',
            escapeshellarg($ocrmypdf),
            escapeshellarg($absolutePdfPath),
            escapeshellarg($outputPath)
        );

        $output = shell_exec($command);
        if (! file_exists($outputPath)) {
            Log::warning('ocrmypdf produced no output', ['output' => $output]);

            return false;
        }

        if (! rename($outputPath, $absolutePdfPath)) {
            @unlink($outputPath);
            Log::warning('Failed to overwrite original PDF with OCR result');

            return false;
        }

        Log::info('ocrmypdf added text layer to PDF', ['pdf' => basename($absolutePdfPath)]);

        return true;
    }

    /**
     * Locate the ocrmypdf binary if installed, else null. Prefers the project
     * Python venv since pdfplumber lives there.
     */
    private static function findOcrMyPdf(): ?string
    {
        $candidates = [
            '/opt/pdftools/bin/ocrmypdf',
            '/usr/bin/ocrmypdf',
            'ocrmypdf',
        ];

        foreach ($candidates as $cmd) {
            if (str_starts_with($cmd, '/') && is_executable($cmd)) {
                return $cmd;
            }
            $found = trim((string) shell_exec('which '.escapeshellarg($cmd).' 2>/dev/null'));
            if ($found !== '' && is_executable($found)) {
                return $found;
            }
        }

        return null;
    }

    /**
     * Locate the LibreOffice/soffice binary if installed, else null.
     */
    private static function findSoffice(): ?string
    {
        foreach (['/usr/bin/soffice', '/usr/bin/libreoffice', 'soffice', 'libreoffice'] as $cmd) {
            $found = trim((string) shell_exec('which '.escapeshellarg($cmd).' 2>/dev/null'));
            if ($found !== '' && is_executable($found)) {
                return $found;
            }
        }

        return null;
    }

    /**
     * Convert an uploaded image into a single-page PDF stored on the public disk.
     *
     * @throws Exception when Mpdf fails to render the image
     */
    private static function convertImageToPdf(UploadedFile $image, string $directory): string
    {
        $sourcePath = $image->getRealPath();
        if (! $sourcePath || ! is_readable($sourcePath)) {
            throw new Exception('Uploaded image could not be read for PDF conversion.');
        }

        $tempDir = storage_path('app/mpdf');
        if (! is_dir($tempDir) && ! mkdir($tempDir, 0775, true) && ! is_dir($tempDir)) {
            throw new Exception('Failed to create Mpdf temp directory.');
        }

        try {
            $mpdf = new Mpdf([
                'tempDir' => $tempDir,
                'margin_left' => 10,
                'margin_right' => 10,
                'margin_top' => 10,
                'margin_bottom' => 10,
            ]);

            // Mpdf reads local file paths directly. Constrain image dimensions so
            // tall portrait scans stay on one page.
            $html = sprintf(
                '<div style="text-align:center;"><img src="%s" style="max-width:100%%; max-height:260mm;" /></div>',
                $sourcePath
            );

            $mpdf->WriteHTML($html);

            $base = Str::slug(pathinfo($image->getClientOriginalName(), PATHINFO_FILENAME) ?: 'bank-statement');
            $relativePath = trim($directory, '/').'/'.$base.'-'.Str::random(8).'.pdf';

            // Store to public disk (which might be GCS)
            \Illuminate\Support\Facades\Storage::disk('public')->put($relativePath, $mpdf->Output('', Destination::STRING_RETURN));

            return $relativePath;
        } catch (Throwable $e) {
            Log::error('Failed to convert image bank statement to PDF', [
                'error' => $e->getMessage(),
                'file' => $image->getClientOriginalName(),
            ]);
            throw new Exception('Could not convert image to PDF: '.$e->getMessage());
        }
    }
}