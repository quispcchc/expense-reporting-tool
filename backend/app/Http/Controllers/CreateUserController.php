<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Notifications\VerifyEmailNotification;

class CreateUserController extends Controller
{
    public function createUser(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'role_id' => 'required|exists:roles,id', // Assuming roles are managed in a roles table
            'email' => 'required|email|unique:users,email',
        ]);

        // Create user without password (admin-controlled creation)
        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            // Note: the application uses `user_pass` as the stored password column in factories/models.
            // We intentionally leave password/user_pass null so the admin triggers verification flow.
            'password' => null,
            'role_id' => $request->role_id, // Assuming role_id is provided
            'email_verified_at' => null,
        ]);

        // Generate a verification token
        $token = Str::random(64);

        // Store the token
        DB::table('email_verification_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token' => bcrypt($token),
                'created_at' => now(),
            ]
        );

        // Send email with verification link
        $user->notify(new VerifyEmailNotification($token));

        // Return the created user object in the response so frontend can append without re-fetching.
        return response()->json([
            'message' => 'User created. A verification email has been sent.',
            'user' => $user,
        ], 201);
    }
}
