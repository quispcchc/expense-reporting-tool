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
        $path = ltrim($path, '/');
        
        if (!Storage::disk('public')->exists($path)) {
            abort(404);
        }

        return Storage::disk('public')->response($path);
    }
}
