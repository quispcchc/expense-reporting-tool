<?php

namespace App\Policies;

use App\Enums\RoleLevel;
use App\Models\AccountNumber;
use App\Models\User;

class AccountNumberPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->role->role_level <= RoleLevel::TEAM_LEAD; // Team Lead and above
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, AccountNumber $accountNumber): bool
    {
        return $user->role->role_level <= RoleLevel::TEAM_LEAD; // Team Lead and above
    }

    /**
     * Determine whether the user can create models.
     * Account Numbers are organization-wide, Super Admin and Department Manager can create.
     */
    public function create(User $user): bool
    {
        return $user->role->role_level <= RoleLevel::DEPARTMENT_MANAGER; // Super Admin and Department Manager
    }

    /**
     * Determine whether the user can update the model.
     * Account Numbers are organization-wide, Super Admin and Department Manager can update.
     */
    public function update(User $user, AccountNumber $accountNumber): bool
    {
        return $user->role->role_level <= RoleLevel::DEPARTMENT_MANAGER; // Super Admin and Department Manager
    }

    /**
     * Determine whether the user can delete the model.
     * Account Numbers are organization-wide, Super Admin and Department Manager can delete.
     */
    public function delete(User $user, AccountNumber $accountNumber): bool
    {
        return $user->role?->role_level <= RoleLevel::DEPARTMENT_MANAGER; // Super Admin and Department Manager
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, AccountNumber $accountNumber): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, AccountNumber $accountNumber): bool
    {
        return false;
    }
}
