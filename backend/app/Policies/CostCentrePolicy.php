<?php

namespace App\Policies;

use App\Enums\RoleLevel;
use App\Models\CostCentre;
use App\Models\User;

class CostCentrePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->role->role_level <= RoleLevel::TEAM_LEAD; // Approver and above
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, CostCentre $costCentre): bool
    {
        return $user->role->role_level <= RoleLevel::TEAM_LEAD; // Approver and above
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, CostCentre $costCentre): bool
    {
        return $user->role->role_level === RoleLevel::SUPER_ADMIN;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, CostCentre $costCentre): bool
    {
        return $user->role->role_level === RoleLevel::SUPER_ADMIN;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, CostCentre $costCentre): bool
    {
        return $user->role?->role_level === RoleLevel::SUPER_ADMIN;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, CostCentre $costCentre): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, CostCentre $costCentre): bool
    {
        return false;
    }
}
