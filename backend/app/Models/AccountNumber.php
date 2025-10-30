<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountNumber extends Model
{
    //
    protected $table = 'account_numbers';

    protected $fillable = [
        'account_number',
        'description',
    ];
}
