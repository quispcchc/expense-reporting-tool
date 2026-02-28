<?php

namespace App\Policies;

use App\Enums\RoleLevel;
use App\Models\Tag;
use App\Models\User;

class TagPolicy
{
    /**
     * Determine whether the user can create models.
     * Only super admin and admin can create tags.
     */
    public function create(User $user): bool
    {
        return $user->role->role_level <= RoleLevel::DEPARTMENT_MANAGER;
    }

    /**
     * Determine whether the user can update the model.
     * Only super admin and admin can update tags.
     */
    public function update(User $user, Tag $tag): bool
    {
        return $user->role->role_level <= RoleLevel::DEPARTMENT_MANAGER;
    }

    /**
     * Determine whether the user can delete the model.
     * Only super admin and admin can delete tags.
     */
    public function delete(User $user, Tag $tag): bool
    {
        return $user->role?->role_level <= RoleLevel::DEPARTMENT_MANAGER;
    }
}
