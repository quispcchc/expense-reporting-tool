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
        if ($authUser->role?->role_level === 2 && $request->filled('role_id')) {
            $newRole = \App\Models\Role::find($request->role_id);
            if ($newRole && $newRole->role_level <= 2) {
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
        $authUser = $request->user();
        $user = User::where('user_id', $id)->firstOrFail();

        // Authorize user delete access
        $authError = $this->authorizeUserDelete($authUser, $user);
        if ($authError) {
            return $authError;
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * Check if authenticated user can view the users list
     * Uses role_level: 1=super_admin, 2=admin, 3=approver
     */
    private function canViewUsers($authUser): bool
    {
        return $authUser->role?->role_level <= 3;
    }

    /**
     * Apply role-based filtering to user query
     * Uses role_level instead of role_name for consistency
     */
    private function applyRoleBasedFiltering($query, $authUser)
    {
        $roleLevel = $authUser->role?->role_level;

        return match (true) {
            $roleLevel === 1 => $query, // Super admin sees all
            $roleLevel === 2 => $query->where('department_id', $authUser->department_id), // Admin sees own dept
            $roleLevel === 3 => $query->whereHas('teams', function ($q) use ($authUser) {
                if (method_exists($authUser, 'teams')) {
                    $q->whereIn('teams.team_id', $authUser->teams->pluck('team_id'));
                }
            }), // Approver sees own team members
            default => $query->where('user_id', $authUser->user_id), // Regular users see only themselves
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
                'can_self_approve' => $user->can_self_approve,
            ];
        });
    }

    /**
     * Authorize user edit access based on role level and department
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

        $authRoleLevel = $authUser->role?->role_level;
        $userRoleLevel = $user->role?->role_level;

        // Super admin can edit anyone, including themselves
        if ($authRoleLevel === 1) {
            return null; // Authorized
        }

        // Admin (department_manager) can only edit regular users in their department
        if ($authRoleLevel === 2) {
            // Admin cannot edit themselves
            if ($authUser->user_id === $user->user_id) {
                return response()->json([
                    'message' => 'You cannot edit your own profile.',
                ], 403);
            }

            // Admin cannot edit other admin or super_admin users
            if ($userRoleLevel <= 2) {
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
     * Authorize user delete access based on role level and department
     */
    private function authorizeUserDelete($authUser, $user)
    {
        if (! $authUser->relationLoaded('role')) {
            $authUser->load('role');
        }
        if (! $user->relationLoaded('role')) {
            $user->load('role');
        }

        $authRoleLevel = $authUser->role?->role_level;
        $userRoleLevel = $user->role?->role_level;

        // Super admin can delete anyone (except themselves)
        if ($authRoleLevel === 1) {
            if ($authUser->user_id === $user->user_id) {
                return response()->json([
                    'message' => 'You cannot delete yourself.',
                ], 403);
            }

            return null;
        }

        // Admin can delete users in their department (not self, not admins/super_admins)
        if ($authRoleLevel === 2) {
            if ($authUser->user_id === $user->user_id) {
                return response()->json([
                    'message' => 'You cannot delete yourself.',
                ], 403);
            }

            if ($userRoleLevel <= 2) {
                return response()->json([
                    'message' => 'Unauthorized. You can only delete regular users and approvers in your department.',
                ], 403);
            }

            if ($user->department_id !== $authUser->department_id) {
                return response()->json([
                    'message' => 'Unauthorized. You can only delete users in your department.',
                ], 403);
            }

            return null;
        }

        return response()->json([
            'message' => 'Unauthorized. Only super admin and admin can delete users.',
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
            'can_self_approve' => 'sometimes|boolean',
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
            'can_self_approve',
        ];
    }
}
