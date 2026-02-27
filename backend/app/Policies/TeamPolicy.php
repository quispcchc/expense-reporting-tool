<?php

namespace App\Policies;

use App\Models\Team;
use App\Models\User;

class TeamPolicy
{
    /**
     * Determine whether the user can create teams.
     * Super admin can create any team.
     * Admin can only create teams in their own department.
     */
    public function create(User $user, Team $team): bool
    {
        if ($user->role->role_level === 1) {
            return true;
        }

        if ($user->role->role_level === 2) {
            return $team->department_id === $user->department_id;
        }

        return false;
    }

    /**
     * Determine whether the user can update the team.
     * Super admin can update any team.
     * Admin can only update teams in their own department.
     */
    public function update(User $user, Team $team): bool
    {
        if ($user->role->role_level === 1) {
            return true;
        }

        if ($user->role->role_level === 2) {
            return $team->department_id === $user->department_id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the team.
     * Super admin can delete any team.
     * Admin can only delete teams in their own department.
     */
    public function delete(User $user, Team $team): bool
    {
        if ($user->role->role_level === 1) {
            return true;
        }

        if ($user->role->role_level === 2) {
            return $team->department_id === $user->department_id;
        }

        return false;
    }
}
