<?php

namespace App\Http\Controllers;

use App\Models\Position;
use App\Models\Role;
use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateUserController extends Controller
{
    public function createUser(Request $request)
    {
        // Get the authenticated user
        $authUser = $request->user();

        // Check if user is admin or super_admin
        if (! $authUser || ! in_array($authUser->role?->role_name, ['admin', 'super_admin'])) {
            return response()->json([
                'message' => 'Unauthorized. Only admin and super admin can create users.',
            ], 403);
        }

        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'role_id' => 'required|exists:roles,role_id',
            'email' => 'required|email|unique:users,email',
            'department_id' => 'nullable|exists:departments,department_id',
            'team_ids' => 'nullable|array',
            'team_ids.*' => 'exists:teams,team_id',
            'position_name' => 'nullable|string|max:255',
        ]);

        // Authorization checks
        $newRole = Role::find($request->role_id);

        // Only super_admin can grant admin or super_admin roles
        if ($newRole && in_array($newRole->role_name, ['admin', 'super_admin'])) {
            if ($authUser->role?->role_name !== 'super_admin') {
                return response()->json([
                    'message' => 'Unauthorized. Only super admin can grant admin privileges.',
                ], 403);
            }
        }

        // If auth user is admin (not super_admin), they can only create users in their own department
        if ($authUser->role?->role_name === 'admin' && $authUser->role?->role_name !== 'super_admin') {
            if ($request->filled('department_id') && $request->department_id !== $authUser->department_id) {
                return response()->json([
                    'message' => 'Unauthorized. You can only create users in your own department.',
                ], 403);
            }
            // If no department specified, assign to admin's department
            if (! $request->filled('department_id')) {
                $request->merge(['department_id' => $authUser->department_id]);
            }
        }

        // Handle position: check if it exists, if not create it
        $positionId = null;

        if ($request->filled('position_name')) {
            // Format position name: trim and capitalize first letter of each word
            $positionName = ucwords(strtolower(trim($request->position_name)));

            $position = Position::where('position_name', $positionName)->first();

            if (! $position) {
                // Create new position if it doesn't exist
                $position = Position::create([
                    'position_name' => $positionName,
                    'position_desc' => null,
                    'active_status_id' => 1,
                ]);
            }

            $positionId = $position->position_id;
        }

        // Create user without password (admin-controlled creation)
        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            // Note: the application uses `user_pass` as the stored password column in factories/models.
            // We intentionally leave password/user_pass null so the admin triggers verification flow.

            'user_pass' => null,
            'role_id' => $request->role_id,
            'department_id' => $request->department_id,
            'position_id' => $positionId,
            'active_status_id' => 1,
            'email_verified_at' => null,
        ]);

        // Assign teams if provided
        if ($request->filled('team_ids')) {
            $user->teams()->sync($request->team_ids);
        }

        // Generate a verification token
        $token = Str::random(64);

        // Store the token with bcrypt for better security
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
            'user' => [
                'user_id' => $user->user_id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'role_id' => $user->role_id,
                'department_id' => $user->department_id,
                'teams' => $user->teams->map(function ($team) {
                    return [
                        'team_id' => $team->team_id,
                        'team_name' => $team->team_name,
                        'team_abbreviation' => $team->team_abbreviation,
                    ];
                }),
                'active_status_id' => $user->active_status_id,
            ]
        ], 201);
    }
}
