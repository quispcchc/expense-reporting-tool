<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        if (isset($_SERVER['GAE_SERVICE']) || isset($_SERVER['GAE_ENV'])) {
            $storagePath = env('APP_STORAGE', '/tmp/storage');
            $this->app->useStoragePath($storagePath);

            // Ensure required storage directories exist in /tmp
            $directories = [
                $storagePath . '/app/public',
                $storagePath . '/app/private',
                $storagePath . '/framework/views',
                $storagePath . '/framework/cache',
                $storagePath . '/framework/sessions',
                $storagePath . '/logs',
            ];

            foreach ($directories as $directory) {
                if (!is_dir($directory)) {
                    mkdir($directory, 0777, true);
                }
            }
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
