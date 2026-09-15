<?php

namespace App\Policies;

use App\Enums\RoleLevel;
use App\Models\Department;
use App\Models\User;

class DepartmentPolicy
{
    /**
     * Determine whether the user can create models.
     * Only super admin can create new departments.
     */
    public function create(User $user): bool
    {
        return $user->role->role_level === RoleLevel::SUPER_ADMIN;
    }

    /**
     * Determine whether the user can update the model.
     * Only super admin can update departments.
     */
    public function update(User $user, Department $department): bool
    {
        return $user->role->role_level === RoleLevel::SUPER_ADMIN;
    }

    /**
     * Determine whether the user can delete the model.
     * Only super admin can delete departments.
     */
    public function delete(User $user, Department $department): bool
    {
        return $user->role->role_level === RoleLevel::SUPER_ADMIN;
    }
}
