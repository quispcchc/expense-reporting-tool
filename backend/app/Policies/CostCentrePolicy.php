<?php

namespace App\Policies;

use App\Models\CostCentre;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class CostCentrePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->role->role_level <= 3; // Approver and above
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, CostCentre $costCentre): bool
    {
        return $user->role->role_level <= 3; // Approver and above
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user,CostCentre $costCentre): bool
    {
        // Super admin can create anything
        if ($user->role->role_level === 1) {
            return true;
        }

        // Admin can only create their department's cost centres
        if ($user->role->role_level === 2) {
            return $costCentre->department_id === $user->department_id;
        }
        return false;
    }

    /**
     * Determine whether the user can update the model.
     */

    public function update(User $user, CostCentre $costCentre): bool
    {
        // Super admin can update anything
        if ($user->role->role_level === 1) {
            return true;
        }

        // Admin can only update their department's cost centres
        if ($user->role->role_level === 2) {
            return $costCentre->department_id === $user->department_id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, CostCentre $costCentre): bool
    {
        // Super admin can delete anything
        if ($user->role?->role_level === 1) {
            return true;
        }

        // Admin can only delete their team's cost centres
        if ($user->role?->role_level === 2) {
            return $costCentre->department_id === $user->department_id;
        }

        return false;
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
