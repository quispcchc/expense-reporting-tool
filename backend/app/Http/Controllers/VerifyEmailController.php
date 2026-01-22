<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class VerifyEmailController extends Controller
{
    public function verifyEmail(Request $request)
    {
        // Validate input
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Find user by email
        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json([
                'message' => 'User not found.',
            ], 404);
        }

        // Check if email is already verified
        if ($user->email_verified_at) {
            return response()->json([
                'message' => 'Email already verified.',
            ], 400);
        }

        // Check if verification token exists and is valid
        $verificationToken = DB::table('email_verification_tokens')
            ->where('email', $request->email)
            ->first();

        if (! $verificationToken) {
            return response()->json([
                'message' => 'Verification token not found. Please request a new one.',
            ], 404);
        }

        // Verify the token using Hash::check for bcrypt comparison
        if (! Hash::check($request->token, $verificationToken->token)) {
            return response()->json([
                'message' => 'Invalid verification token.',
            ], 401);
        }

        // Check if token has expired (24 hours)
        if (now()->diffInHours($verificationToken->created_at) > 24) {
            return response()->json([
                'message' => 'Verification token has expired. Please request a new one.',
            ], 401);
        }

        // Update user: set password and mark email as verified
        $user->update([
            'user_pass' => Hash::make($request->password),
            'email_verified_at' => now(),
        ]);

        // Delete the used verification token
        DB::table('email_verification_tokens')
            ->where('email', $request->email)
            ->delete();

        return response()->json([
            'message' => 'Email verified successfully.',
            'user' => $user,
        ]);
    }

    public function resendVerificationEmail(Request $request)
    {
        // Validate input
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Find user by email
        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json([
                'message' => 'User not found.',
            ], 404);
        }

        // Check if email is already verified
        if ($user->email_verified_at) {
            return response()->json([
                'message' => 'Email is already verified.',
            ], 400);
        }

        // Generate a new verification token
        $token = \Illuminate\Support\Str::random(64);

        // Store the token
        DB::table('email_verification_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token' => bcrypt($token),
                'created_at' => now(),
            ]
        );

        // Send email with verification link
        $user->notify(new \App\Notifications\VerifyEmailNotification($token));

        return response()->json([
            'message' => 'Verification email sent. Please check your email.',
        ]);
    }

    public function checkEmailVerification(Request $request)
    {
        // Validate input
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Find user by email
        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json([
                'message' => 'User not found.',
                'is_verified' => false,
            ], 404);
        }

        // Check if email is verified by checking email_verified_at field
        $isVerified = ! is_null($user->email_verified_at);

        return response()->json([
            'is_verified' => $isVerified,
            'email' => $user->email,
            'message' => $isVerified ? 'Email is already verified.' : 'Email is not yet verified.',
        ]);
    }
}
