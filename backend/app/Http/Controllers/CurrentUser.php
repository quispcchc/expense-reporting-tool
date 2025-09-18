<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class CurrentUserController extends Controller
{
    /** 
     * Return the currently authenticated user's details.
     */
    public function show()
    {
        $user = Auth::user()->load([
            'role',
            'team',
            'position',
            'claims' => function ($query) {
                $query->with(['status']);
            }
        ]);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'team' => $user->team,
                'position' => $user->position,
                'claims' => $user->claims,
            ]
        ]);
    }
}
