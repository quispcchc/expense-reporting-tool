<?php

namespace App\Enums;

class RoleLevel
{
    const SUPER_ADMIN = 1;

    const DEPARTMENT_MANAGER = 2;

    const TEAM_LEAD = 3;

    const USER = 4;

    public static function getLabel(int $role): string
    {
        return match ($role) {
            self::SUPER_ADMIN => 'Super Admin',
            self::DEPARTMENT_MANAGER => 'Department Manager',
            self::TEAM_LEAD => 'Team Lead',
            self::USER => 'User',
            default => 'Unknown',
        };
    }
}
