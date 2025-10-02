<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleCheck
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  int  $minLevel  Minimum role level required (e.g., 2 for manager and above)
     */
    public function handle(Request $request, Closure $next, int $requiredRoleLevel): Response
    {
        $user = $request->user();

        if (!$user || !$user->role || $user->role->role_level !== $requiredRoleLevel) {
            return response()->json(['message' => 'Forbidden. Insufficient privileges.'], 403);
        }

        return $next($request);
    }
}
