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
     * Super admin can update any department.
     * Admin (department_manager) can only update their own department.
     */
    public function update(User $user, Department $department): bool
    {
        if ($user->role->role_level === RoleLevel::SUPER_ADMIN) {
            return true;
        }

        if ($user->role->role_level === RoleLevel::DEPARTMENT_MANAGER) {
            return $department->department_id === $user->department_id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     * Super admin can delete any department.
     * Admin (department_manager) can only delete their own department.
     */
    public function delete(User $user, Department $department): bool
    {
        if ($user->role->role_level === RoleLevel::SUPER_ADMIN) {
            return true;
        }

        if ($user->role->role_level === RoleLevel::DEPARTMENT_MANAGER) {
            return $department->department_id === $user->department_id;
        }

        return false;
    }
}
