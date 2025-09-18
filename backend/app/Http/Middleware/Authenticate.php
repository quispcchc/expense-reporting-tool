<?php
namespace App\Http\Middleware;

use closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class Authenticate
{
    public function handle(Request $request, Closure $next, ...$guards){
        if(!Auth::check()){
            return redirect('/login');
        }
        return $next($request);
    }
}