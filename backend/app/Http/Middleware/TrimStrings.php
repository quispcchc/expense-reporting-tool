<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
class TrimStrings
{
    public function handle(Request $request, Closure $next){
        $trimmedString= array_map(function($value){
            return is_string($value)? trim($value) :$value;
        }, $request->all());
        $request->merge($trimmedString);
        return $next($request);

    }
}