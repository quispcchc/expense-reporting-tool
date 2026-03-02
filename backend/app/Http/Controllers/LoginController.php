<?php

namespace App\Http\Controllers;

use App\Enums\ActiveStatus;
use App\Models\User;
use Illuminate\Http\Request; // require for API login
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    // Login function for api with sanctum
    public function login(Request $request)
    {

        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);
        // find user
        $user = User::with(['role', 'teams', 'activeStatus'])->where('email', $request->email)->first();
        // Check if user exists
        if (! $user || ! Hash::check($request->password, $user->user_pass)) {
            return $this->errorResponse(trans('messages.invalid_email_password'), 401);
        }
        // Check if user is inactive
        if ($user->active_status_id === ActiveStatus::INACTIVE) {
            return $this->errorResponse('Your account is inactive. Please contact the administrator.', 403);
        }
        // Check if email is verified
        if (is_null($user->email_verified_at)) {
            return $this->errorResponse(trans('messages.verify_email'), 403);
        }

        // generate token with optional expiration for "Remember Me"
        $remember = $request->boolean('remember', false);
        $expiration = $remember ? now()->addDays(30) : null;
        $token = $user->createToken('api_token', ['*'], $expiration)->plainTextToken;

        $data = [
            'user' => [
                'full_name' => $user->full_name,
                'email' => $user->email,
                'role_name' => $user->role_name,
                'department_id' => $user->department_id,
                'position_id' => $user->position->position_id,
            ],
        ];

        // Set auth token as HttpOnly cookie — invisible to JavaScript
        // Session cookie (0 minutes) when not remembered, 30 days when remembered
        $cookieMinutes = $remember ? 60 * 24 * 30 : 0;
        $secure = app()->environment('production');
        $cookie = cookie('auth_token', $token, $cookieMinutes, '/', null, $secure, true, false, 'Strict');

        return $this->successResponse($data)->withCookie($cookie);
    }
}
