<?php

use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Global middleware
        $middleware->use([
            \Illuminate\Http\Middleware\HandleCors::class,
            \App\Http\Middleware\ForceCorsHeaders::class,
        ]);

        // API middleware group (adds route model binding + throttle if needed later)
        $middleware->group('api', [
            \Illuminate\Http\Middleware\HandleCors::class,
            \Illuminate\Cookie\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \App\Http\Middleware\ReadTokenFromCookie::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);

        // Exclude frontend-set cookies from encryption/decryption
        EncryptCookies::except(['authUser', 'token', 'remember_session']);

        $middleware->alias([
            'role' => \App\Http\Middleware\RoleCheck::class,
            'force.cors' => \App\Http\Middleware\ForceCorsHeaders::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
