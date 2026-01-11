<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request; // require for API login
use Illuminate\Support\Facades\Hash;
use App\Traits\ApiResponse;

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
        $user = User::with(['role', 'team'])->where('email', $request->email)->first();
        // Check if user exists
        if (!$user || !Hash::check($request->password, $user->user_pass)) {
            return $this->errorResponse(trans('messages.invalid_email_password'), 401);
        }
        // Check if email is verified
        if (is_null($user->email_verified_at)) {
            return $this->errorResponse(trans('messages.verify_email'), 403);
        }

        // generate token
        $token = $user->createToken('api_token')->plainTextToken;

        $data = [
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'full_name' => $user->full_name,
                'email' => $user->email,
                'role_name' => $user->role_name,
                'department_id' => $user->department_id,
                'position_id' => $user->position->position_id,
            ],
        ];

        return $this->successResponse($data);
    }
}
