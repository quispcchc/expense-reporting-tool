<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceCorsHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $origin = $request->headers->get('Origin', '*');

        $response->headers->set('Access-Control-Allow-Origin', $origin ?: '*');
        $response->headers->set('Vary', 'Origin');
        $response->headers->set('Access-Control-Expose-Headers', 'Authorization');
        $response->headers->set('X-Force-Cors', 'applied');

        return $response;
    }
}
