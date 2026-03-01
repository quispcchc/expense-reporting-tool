<?php

namespace App\Enums;

class ClaimType
{
    const REIMBURSEMENT = 1;

    const PETTY_CASH = 2;

    const CORPORATE_CARD = 3;

    const NON_STAFF = 4;

    const VENDOR_INVOICE = 5;

    public static function getLabel(int $type): string
    {
        return match ($type) {
            self::REIMBURSEMENT => 'Reimbursement',
            self::PETTY_CASH => 'Petty Cash',
            self::CORPORATE_CARD => 'Corporate Card',
            self::NON_STAFF => 'Non-Staff',
            self::VENDOR_INVOICE => 'Vendor Invoice',
            default => 'Unknown',
        };
    }
}
