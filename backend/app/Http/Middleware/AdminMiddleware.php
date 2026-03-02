<?php

namespace App\Http\Middleware;

use App\Enums\RoleLevel;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        /*
            This Part is still underdevelopment, please do not use it!
        */
        // Ensure the user is authenticated and has the admin role
        $user = $request->user();

        if (! $user || ! $user->role || $user->role->role_level > RoleLevel::DEPARTMENT_MANAGER) {
            return response()->json(['message' => 'Unauthorized. Admins only.'], 403);
        }

        return $next($request);
    }
}
