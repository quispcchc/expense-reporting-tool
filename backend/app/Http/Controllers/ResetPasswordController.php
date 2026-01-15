<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

/*
 * this function will take a reset token from Forgetpassword controller to verify the  auth of user
 */

class ResetPasswordController extends Controller
{
    public function reset(Request $request)
    {
        /*
         * validate the variables
         */
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'token' => 'required',
            'password' => 'required|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'user_pass' => Hash::make($password),
                ])->save();
            }
        );

        return $status === Password::PASSWORD_RESET
            ? response()->json(['message' => 'Password has been reset successfully.','success' => true], 200)
            : response()->json(['message' => __($status)], 400);
    }
}
