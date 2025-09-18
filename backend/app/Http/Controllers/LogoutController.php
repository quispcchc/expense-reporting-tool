<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LogoutController extends Controller
{
    /*
     * Logout the authenticated user by deleting their current token.
     */
    public function logout(Request $request)
    {

        $token = Auth::user()->currentAccessToken();
        if ($token) {
            $token->delete();
        }

        return response()->json(['message' => 'Successfully logged out']);
    }
}
