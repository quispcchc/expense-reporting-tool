<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StorageController extends Controller
{
    /**
     * Serve a file from the public storage disk.
     * This works for both local and cloud storage (GCS).
     */
    public function show(string $path): StreamedResponse
    {
        $disk = 'public';
        $exists = Storage::disk($disk)->exists($path);
        
        \Log::info('StorageController@show', [
            'path' => $path,
            'disk_driver' => config("filesystems.disks.{$disk}.driver"),
            'bucket' => config("filesystems.disks.{$disk}.bucket"),
            'exists' => $exists,
            'url' => Storage::disk($disk)->url($path),
        ]);

        if (!$exists) {
            abort(404);
        }

        return Storage::disk($disk)->response($path);
    }
}
