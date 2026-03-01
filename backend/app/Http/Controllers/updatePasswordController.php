<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class updatePasswordController extends Controller
{
    /**
     * Update the authenticated user's password.
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed', // must also send new_password_confirmation
        ]);

        $userId = auth()->id(); // check
        if (! $userId) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $user = User::select('user_id', 'user_pass')->find($userId);
        // Check current password matches
        if (! Hash::check($request->current_password, $user->user_pass)) {
            return response()->json(['message' => 'Current password is incorrect'], 403);
        }

        // Update the password
        $user->user_pass = Hash::make($request->new_password);
        $user->save();

        // Revoke all tokens so the user must re-login with the new password
        $user->tokens()->delete();

        return response()->json(['message' => 'Password updated successfully'])
            ->withCookie(cookie()->forget('auth_token'));
    }
}
