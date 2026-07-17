<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RoleController extends Controller
{
    // List all roles
    public function index()
    {
        return response()->json(Role::orderBy('role_id')->get());
    }

    // Create a new role
    public function store(Request $request)
    {
        $request->validate([
            'role_id' => 'required|integer|unique:roles,role_id',
            'active_status_id' => 'required|integer',
            'role_name' => 'required|string|max:50|unique:roles,role_name',
            'role_level' => 'required|integer',
            'role_desc' => 'nullable|string',
        ]);

        $role = Role::create($request->only([
            'role_id', 'active_status_id', 'role_name', 'role_level', 'role_desc',
        ]));

        return response()->json(['message' => 'Role created', 'role' => $role]);
    }

    // Update a role
    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $request->validate([
            'active_status_id' => 'required|integer',
            'role_name' => 'required|string|max:50|unique:roles,role_name,'.$id.',role_id',
            'role_desc' => 'nullable|string',
        ]);

        $role->update($request->only(['active_status_id', 'role_name', 'role_desc']));

        return response()->json(['message' => 'Role updated', 'role' => $role]);
    }

    // Delete a role
    public function destroy($id)
    {
        try {
            $role = Role::findOrFail($id);

            // Check if there are any associated users
            if ($role->users()->count() > 0) {
                return response()->json([
                    'status' => false,
                    'message' => 'Cannot delete role because it has associated users.',
                ], 422);
            }

            DB::beginTransaction();
            $role->delete();

            // Clear lookup cache since it includes roles
            LookupController::clearCache();
            DB::commit();

            return response()->json(['message' => 'Role deleted']);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error deleting role: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to delete role. ' . (config('app.debug') ? $e->getMessage() : 'An unexpected error occurred.'),
            ], 500);
        }
    }
}
