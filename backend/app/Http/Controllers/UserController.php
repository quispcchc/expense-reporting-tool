<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Get list of users with role-based access control
     */
    public function index(Request $request)
    {
        $authUser = $request->user();

        // Authorize user access to user list
        if (! $this->canViewUsers($authUser)) {
            return response()->json([
                'message' => 'Unauthorized. Only super_admin, admin, and approver can view users.',
            ], 403);
        }

        // Get users with related data and apply role-based filtering
        $query = User::with(['role', 'department', 'teams', 'activeStatus']);
        $query = $this->applyRoleBasedFiltering($query, $authUser);

        return response()->json($this->formatUsers($query->get()));
    }

    /**
     * Update user information
     */
    public function update(Request $request, $id)
    {
        $authUser = $request->user();
        $user = User::where('user_id', $id)->firstOrFail();

        // Authorize user edit access
        $authError = $this->authorizeUserEdit($authUser, $user);
        if ($authError) {
            return $authError;
        }
        // If admin is updating, prevent promoting to admin or super_admin
        if ($authUser->role?->role_name === 'admin' && $request->filled('role_id')) {
            $newRole = \App\Models\Role::find($request->role_id);
            if ($newRole && in_array($newRole->role_name, ['admin', 'super_admin'])) {
                return response()->json([
                    'message' => 'Admins cannot promote users to admin or super admin roles.',
                ], 403);
            }
        }

        // Validate input
        $validator = Validator::make($request->all(), $this->getUserValidationRules($user->user_id));

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Update user with validated data
        $user->fill($request->only($this->getEditableFields()));
        $user->save();

        // Sync teams if provided
        if ($request->filled('team_ids')) {
            $user->teams()->sync($request->team_ids);
        }

        return response()->json(['user' => $user]);
    }

    /**
     * Delete a user
     */
    public function destroy(Request $request, $id)
    {
        $user = User::where('user_id', $id)->firstOrFail();
        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * Check if authenticated user can view the users list
     */
    private function canViewUsers($authUser): bool
    {
        $viewableRoles = ['super_admin', 'admin', 'approver'];

        return in_array($authUser->role?->role_name, $viewableRoles);
    }

    /**
     * Apply role-based filtering to user query
     */
    private function applyRoleBasedFiltering($query, $authUser)
    {
        return match ($authUser->role?->role_name) {
            'super_admin' => $query,
            'admin' => $query->where('department_id', $authUser->department_id),
            'approver' => $query->whereHas('teams', function ($q) use ($authUser) {
                if (method_exists($authUser, 'teams')) {
                    $q->whereIn('teams.team_id', $authUser->teams->pluck('team_id'));
                }
            }),
            default => $query,
        };
    }

    /**
     * Format users for API response
     */
    private function formatUsers($users)
    {
        return $users->map(function ($user) {
            return [
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
            ];
        });
    }

    /**
     * Authorize user edit access based on role and department
     */
    private function authorizeUserEdit($authUser, $user)
    {
        // Load role relationships if not already loaded
        if (! $authUser->relationLoaded('role')) {
            $authUser->load('role');
        }
        if (! $user->relationLoaded('role')) {
            $user->load('role');
        }

        $authRoleName = $authUser->role?->role_name;
        $userRoleName = $user->role?->role_name;

        // Super admin can edit anyone, including themselves
        if ($authRoleName === 'super_admin') {
            return null; // Authorized
        }

        // Admin can only edit regular users in their department
        if ($authRoleName === 'admin') {
            // Admin cannot edit themselves
            if ($authUser->user_id === $user->user_id) {
                return response()->json([
                    'message' => 'You cannot edit your own profile.',
                ], 403);
            }

            // Admin cannot edit other admin or super_admin users
            if (in_array($userRoleName, ['admin', 'super admin'])) {
                return response()->json([
                    'message' => 'Unauthorized. You can only edit regular users and approvers in your department.',
                ], 403);
            }

            // Admin can only edit users in their department
            if ($user->department_id !== $authUser->department_id) {
                return response()->json([
                    'message' => 'Unauthorized. You can only edit users in your department.',
                ], 403);
            }

            return null; // Authorized
        }

        // Other roles cannot edit users
        return response()->json([
            'message' => 'Unauthorized. Only super admin and admin can edit users.',
        ], 403);
    }

    /**
     * Get user validation rules for update
     */
    private function getUserValidationRules($userId): array
    {
        return [
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => "sometimes|email|unique:users,email,{$userId},user_id",
            'role_id' => 'sometimes|integer|exists:roles,role_id',
            'department_id' => 'sometimes|integer|exists:departments,department_id',
            'team_ids' => 'nullable|array',
            'team_ids.*' => 'exists:teams,team_id',
            'position_id' => 'sometimes|integer|exists:positions,position_id',
            'active_status_id' => 'sometimes|integer|exists:active_status,active_status_id',
        ];
    }

    /**
     * Get list of fields that can be edited
     */
    private function getEditableFields(): array
    {
        return [
            'first_name',
            'last_name',
            'email',
            'role_id',
            'department_id',
            'position_id',
            'active_status_id',
        ];
    }
}
