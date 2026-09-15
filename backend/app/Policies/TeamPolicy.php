<?php

namespace App\Policies;

use App\Enums\RoleLevel;
use App\Models\Team;
use App\Models\User;

class TeamPolicy
{
    /**
     * Determine whether the user can create teams.
     * Only super admin can create teams.
     */
    public function create(User $user, Team $team): bool
    {
        return $user->role->role_level === RoleLevel::SUPER_ADMIN;
    }

    /**
     * Determine whether the user can update the team.
     * Only super admin can update teams.
     */
    public function update(User $user, Team $team): bool
    {
        return $user->role->role_level === RoleLevel::SUPER_ADMIN;
    }

    /**
     * Determine whether the user can delete the team.
     * Only super admin can delete teams.
     */
    public function delete(User $user, Team $team): bool
    {
        return $user->role->role_level === RoleLevel::SUPER_ADMIN;
    }
}
