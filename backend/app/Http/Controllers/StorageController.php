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
    public function show(string $path)
    {
        $disk = 'public';
        $path = ltrim($path, '/');
        $exists = Storage::disk($disk)->exists($path);
        
        \Log::info('StorageController@show', [
            'path' => $path,
            'disk_driver' => config("filesystems.disks.{$disk}.driver"),
            'bucket' => config("filesystems.disks.{$disk}.bucket"),
            'exists' => $exists,
            'full_url' => request()->fullUrl(),
        ]);

        if (!$exists) {
            // Check if it exists on 'gcs' disk directly if 'public' failed
            if ($disk === 'public' && config('filesystems.disks.public.driver') === 'gcs') {
                $exists = Storage::disk('gcs')->exists($path);
                if ($exists) {
                    \Log::info('File found on gcs disk but not public disk');
                    return Storage::disk('gcs')->response($path);
                }
            }
            abort(404);
        }

        return Storage::disk($disk)->response($path);
    }
}
