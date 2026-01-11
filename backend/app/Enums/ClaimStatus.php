<?php

namespace App\Enums;

class ClaimStatus
{
    const PENDING = 1;
    const APPROVED = 2;
    const REJECTED = 3;
    
    public static function getLabel(int $status): string
    {
        return match ($status) {
            self::PENDING => 'Pending',
            self::APPROVED => 'Approved',
            self::REJECTED => 'Rejected',
            default => 'Unknown',
        };
    }
}
