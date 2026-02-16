<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountNumber extends Model
{
    protected $table = 'account_numbers';

    protected $primaryKey = 'account_number_id';

    protected $fillable = [
        'account_number',
        'description',
    ];

    /**
     * Get the expenses associated with this account number.
     */
    public function expenses()
    {
        return $this->hasMany(Expense::class, 'account_number_id');
    }
}
