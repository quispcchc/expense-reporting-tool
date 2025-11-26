<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * List users (admin)
     */
    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 15);

        // Use pagination to avoid returning a huge result set
        $users = User::with(['role', 'team', 'position', 'activeStatus'])->paginate($perPage);

        return response()->json($users);
    }

    /**
     * Update an existing user (admin)
     */
    public function update(Request $request, $id)
    {
        $user = User::where('user_id', $id)->firstOrFail();

        $validator = Validator::make($request->all(), [
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->user_id . ',user_id',
            'role_id' => 'sometimes|integer|exists:role,role_id',
            'team_id' => 'sometimes|integer|exists:team,team_id',
            'position_id' => 'sometimes|integer|exists:position,position_id',
            'active_status_id' => 'sometimes|integer|exists:active_status,active_status_id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->fill($request->only([
            'first_name', 'last_name', 'email', 'role_id', 'team_id', 'position_id', 'active_status_id'
        ]));

        $user->save();

        return response()->json(['user' => $user]);
    }

    /**
     * Delete a user (admin)
     */
    public function destroy(Request $request, $id)
    {
        $user = User::where('user_id', $id)->firstOrFail();

        $user->delete();

        return response()->json(['message' => 'User deleted']);
    }
}
