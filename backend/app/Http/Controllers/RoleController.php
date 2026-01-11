<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    // List all roles
    public function index()
    {
        return response()->json(Role::all());
    }

    // Create a new role
    public function store(Request $request)
    {
        $request->validate([
            'role_id' => 'required|integer|unique:role,role_id',
            'active_status_id' => 'required|integer',
            'role_name' => 'required|string|max:50|unique:role,role_name',
            'role_desc' => 'nullable|string',
        ]);

        $role = Role::create($request->only([
            'role_id', 'active_status_id', 'role_name', 'role_desc',
        ]));

        return response()->json(['message' => 'Role created', 'role' => $role]);
    }

    // Update a role
    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $request->validate([
            'active_status_id' => 'required|integer',
            'role_name' => 'required|string|max:50|unique:role,role_name,'.$id.',role_id',
            'role_desc' => 'nullable|string',
        ]);

        $role->update($request->only(['active_status_id', 'role_name', 'role_desc']));

        return response()->json(['message' => 'Role updated', 'role' => $role]);
    }

    // Delete a role
    public function destroy($id)
    {
        $role = Role::findOrFail($id);
        $role->delete();

        return response()->json(['message' => 'Role deleted']);
    }
}
