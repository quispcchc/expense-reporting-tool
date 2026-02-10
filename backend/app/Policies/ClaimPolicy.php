<?php

namespace App\Policies;

use App\Models\Claim;
use App\Models\Role;
use App\Models\User;
use App\Enums\RoleLevel;

class ClaimPolicy
{
    public function update(User $user, Claim $claim)
    {
        $role_level = $user->role->role_level;

        if ($role_level === RoleLevel::SUPER_ADMIN) {
            return true;
        }

        if ($role_level === RoleLevel::DEPARTMENT_MANAGER) {
            return $claim->department_id === $user->department_id;
        }

        if ($role_level === RoleLevel::TEAM_LEAD) {
            $teamIds = $user->teams->pluck('team_id')->toArray();
            return in_array($claim->team_id, $teamIds);
        }

        return false;

    }

    public function approve(User $user, Claim $claim)
    {
        $role_level = $user->role->role_level;

        // Block self-approval for EVERYONE EXCEPT Super Admin
        if ($claim->user_id === $user->user_id && $role_level !== RoleLevel::SUPER_ADMIN) {
            return false;
        }

        // Super admin can approve all claims$role_level
        if ($user->role->role_level === RoleLevel::SUPER_ADMIN) {
            return true;
        }

        // Admin can only approve claims under own department
        if ($user->role->role_level === RoleLevel::DEPARTMENT_MANAGER) {
            return $user->department_id === $claim->department_id;
        }

        // Approver can only approve claims under own team, but not claims from other approvers
        if ($user->role->role_level === RoleLevel::TEAM_LEAD) {
            $teamIds = $user->teams->pluck('team_id')->toArray();
            if (!in_array($claim->team_id, $teamIds)) {
                return false;
            }
            // Block approver from approving another approver's claim — must escalate to admin
            $claimOwner = $claim->user;
            if ($claimOwner && $claimOwner->role && $claimOwner->role->role_level <= 3) {
                return false;
            }
            return true;
        }

        // Regular user cannot approve claim
        return false;
    }

    public function reject(User $user, Claim $claim)
    {
        $role_level = $user->role->role_level;

        // Block self-reject for EVERYONE EXCEPT Super Admin
        if ($claim->user_id === $user->user_id && $role_level !== RoleLevel::SUPER_ADMIN) {
            return false;
        }

        // Super admin can reject all claims$role_level
        if ($user->role->role_level === RoleLevel::SUPER_ADMIN) {
            return true;
        }

        // Admin can only reject claims under own department
        if ($user->role->role_level === RoleLevel::DEPARTMENT_MANAGER) {
            return $user->department_id === $claim->department_id;
        }

        // Approver can only reject claims under own team, but not claims from other approvers
        if ($user->role->role_level === RoleLevel::TEAM_LEAD) {
            $teamIds = $user->teams->pluck('team_id')->toArray();
            if (!in_array($claim->team_id, $teamIds)) {
                return false;
            }
            // Block approver from rejecting another approver's claim — must escalate to admin
            $claimOwner = $claim->user;
            if ($claimOwner && $claimOwner->role && $claimOwner->role->role_level <= RoleLevel::TEAM_LEAD) {
                return false;
            }
            return true;
        }

        // Regular user cannot reject claim
        return false;
    }
}
