<?php

namespace App\Enums;

class ActiveStatus
{
    const ACTIVE = 1;

    const INACTIVE = 2;

    public static function getLabel(int $status): string
    {
        return match ($status) {
            self::ACTIVE => 'Active',
            self::INACTIVE => 'Inactive',
            default => 'Unknown',
        };
    }
}
