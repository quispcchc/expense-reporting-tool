<?php

namespace App\Policies;

use App\Enums\ClaimType;
use App\Enums\RoleLevel;
use App\Enums\RoleName;
use App\Models\Claim;
use App\Models\User;

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
        $role_name = $user->role->role_name;

        // Block self-approval unless Super Admin or SLT members (Admins) with can_self_approve on Corporate Card claims
        if ($claim->user_id === $user->user_id && $role_level !== RoleLevel::SUPER_ADMIN) {
            if (! ($user->can_self_approve && $claim->claim_type_id === ClaimType::CORPORATE_CARD)) {
                return false;
            }
        }

        // Super admin can approve all claims
        if ($role_level === RoleLevel::SUPER_ADMIN) {
            return true;
        }

        // Admin and Finance User can only approve claims under own department
        if ($role_level === RoleLevel::DEPARTMENT_MANAGER || $role_name === RoleName::FINANCE_USER) {
            return $user->department_id === $claim->department_id;
        }

        // Approver can only approve claims under own team, but not claims from other approvers
        if ($user->role->role_level === RoleLevel::TEAM_LEAD) {
            $teamIds = $user->teams->pluck('team_id')->toArray();
            if (! in_array($claim->team_id, $teamIds)) {
                return false;
            }
            // Block approver from approving another approver's claim — must escalate to admin
            $claimOwner = $claim->user;
            if ($claimOwner && $claimOwner->role && $claimOwner->role->role_level <= RoleLevel::TEAM_LEAD) {
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
        $role_name = $user->role->role_name;

        // Block self-reject unless Super Admin or user with can_self_approve on Corporate Card claims
        if ($claim->user_id === $user->user_id && $role_level !== RoleLevel::SUPER_ADMIN) {
            if (! ($user->can_self_approve && $claim->claim_type_id === ClaimType::CORPORATE_CARD)) {
                return false;
            }
        }

        // Super admin can reject all claims
        if ($role_level === RoleLevel::SUPER_ADMIN) {
            return true;
        }

        // Admin and Finance User can only reject claims under own department
        if ($role_level === RoleLevel::DEPARTMENT_MANAGER || $role_name === RoleName::FINANCE_USER) {
            return $user->department_id === $claim->department_id;
        }

        // Approver can only reject claims under own team, but not claims from other approvers
        if ($user->role->role_level === RoleLevel::TEAM_LEAD) {
            $teamIds = $user->teams->pluck('team_id')->toArray();
            if (! in_array($claim->team_id, $teamIds)) {
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

    public function markPaid(User $user, Claim $claim)
    {
        $role_name = $user->role->role_name;

        // Only Finance User can mark claims as paid (across all departments)
        if ($role_name === RoleName::FINANCE_USER) {
            return true;
        }

        return false;
    }
}
