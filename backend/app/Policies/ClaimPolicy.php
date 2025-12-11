<?php

namespace App\Policies;

use App\Models\Claim;
use App\Models\User;

class ClaimPolicy
{

  public function update(User $user,Claim $claim) {
        $role_level = $user->role->role_level;

      if ($role_level === 1) {
          return true;
      }

      if ($role_level === 2) {
          return $claim->department_id === $user->department_id;
      }

      if ($role_level === 3) {
          return $claim->team_id === $user->team_id;
      }

      return false;

  }
    public function approve(User $user, Claim $claim)
    {
        $role_level = $user->role->role_level;
;
        // Block self-approval for EVERYONE EXCEPT Super Admin
        if ($claim->user_id === $user->user_id && $role_level !== 1) {
            return false;
        }

        // Super admin can approve all claims$role_level
        if ($user->role->role_level === 1) {
            return true;
        }

        // Admin can only reject claims under own department
        if ($user->role->role_level ===2) {
            return $user->department_id === $claim->department_id;
        }

        // Approver can only reject claims under own team
        if ($user->role->role_level ===3) {
            return $user->team_id === $claim->team_id;
        }

        // Regular user cannot approve claim
        return false;
    }

    public function reject(User $user, Claim $claim) {
        $role_level = $user->role->role_level;
        ;
        // Block self-reject for EVERYONE EXCEPT Super Admin
        if ($claim->user_id === $user->user_id && $role_level !== 1) {
            return false;
        }

        // Super admin can reject all claims$role_level
        if ($user->role->role_level === 1) {
            return true;
        }

        // Admin can only reject claims under own department
        if ($user->role->role_level ===2) {
            return $user->department_id === $claim->department_id;
        }

        // Approver can only reject claims under own team
        if ($user->role->role_level ===3) {
            return $user->team_id === $claim->team_id;
        }

        // Regular user cannot reject claim
        return false;
    }


}
