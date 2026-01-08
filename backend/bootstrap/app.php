<?php

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
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);

        $middleware->alias([
            'role' => \App\Http\Middleware\RoleCheck::class,
            'force.cors' => \App\Http\Middleware\ForceCorsHeaders::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
