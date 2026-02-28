<?php

namespace App\Policies;

use App\Enums\RoleLevel;
use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    /**
     * Determine whether the user can create models.
     * Only super admin and admin can create projects.
     */
    public function create(User $user): bool
    {
        return $user->role->role_level <= RoleLevel::DEPARTMENT_MANAGER;
    }

    /**
     * Determine whether the user can update the model.
     * Only super admin and admin can update projects.
     */
    public function update(User $user, Project $project): bool
    {
        return $user->role->role_level <= RoleLevel::DEPARTMENT_MANAGER;
    }

    /**
     * Determine whether the user can delete the model.
     * Only super admin and admin can delete projects.
     */
    public function delete(User $user, Project $project): bool
    {
        return $user->role?->role_level <= RoleLevel::DEPARTMENT_MANAGER;
    }
}
