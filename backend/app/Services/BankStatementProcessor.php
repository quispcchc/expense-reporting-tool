<?php

namespace App\Services;

use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Mpdf\Mpdf;
use Mpdf\Output\Destination;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\Settings;
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
     * Word documents are converted to PDF using PhpWord on GAE.
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
     * Ensure the upload is available as a PDF on disk.
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

    private static function renderImageToPdf(UploadedFile $image, string $absolutePdfPath): void
    {
        $sourcePath = $image->getRealPath();
        try {
            $mpdf = new Mpdf(['tempDir' => storage_path('app/mpdf')]);
            $mpdf->WriteHTML(sprintf('<div style="text-align:center;"><img src="%s" style="max-width:100%%;" /></div>', $sourcePath));
            $mpdf->Output($absolutePdfPath, Destination::FILE);
        } catch (Throwable $e) {
            Log::error('Image-to-PDF failed', ['error' => $e->getMessage()]);
            throw new Exception('Could not convert image to PDF');
        }
    }

    private static function renderDocToPdf(UploadedFile $doc, string $absolutePdfPath): void
    {
        try {
            $phpWord = IOFactory::load($doc->getRealPath());
            Settings::setPdfRendererName(Settings::PDF_RENDERER_MPDF);
            Settings::setPdfRendererPath(base_path('vendor/mpdf/mpdf'));
            $pdfWriter = IOFactory::createWriter($phpWord, 'PDF');
            $pdfWriter->save($absolutePdfPath);
        } catch (Throwable $e) {
            Log::error('Doc-to-PDF failed', ['error' => $e->getMessage()]);
            throw new Exception('Could not convert Word document to PDF');
        }
    }

    private static function convertImageToPdf(UploadedFile $image, string $directory): string
    {
        $base = Str::slug(pathinfo($image->getClientOriginalName(), PATHINFO_FILENAME));
        $relativePath = trim($directory, '/').'/'.$base.'-'.Str::random(8).'.pdf';
        
        $tempPdf = storage_path('app/tmp/'.Str::random(12).'.pdf');
        self::renderImageToPdf($image, $tempPdf);
        
        \Illuminate\Support\Facades\Storage::disk('public')->put($relativePath, file_get_contents($tempPdf));
        @unlink($tempPdf);
        
        return $relativePath;
    }

    private static function convertDocToPdf(UploadedFile $doc, string $directory): string
    {
        $base = Str::slug(pathinfo($doc->getClientOriginalName(), PATHINFO_FILENAME));
        $relativePath = trim($directory, '/').'/'.$base.'-'.Str::random(8).'.pdf';
        
        $tempPdf = storage_path('app/tmp/'.Str::random(12).'.pdf');
        self::renderDocToPdf($doc, $tempPdf);
        
        \Illuminate\Support\Facades\Storage::disk('public')->put($relativePath, file_get_contents($tempPdf));
        @unlink($tempPdf);
        
        return $relativePath;
    }

    public static function ocrPdfInPlace(string $absolutePdfPath): bool
    {
        // GAE Standard does not support ocrmypdf. 
        // We rely on Google Cloud Vision API inside BankStatementExtractor instead.
        return false;
    }
}
