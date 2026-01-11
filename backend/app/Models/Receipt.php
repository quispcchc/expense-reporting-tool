<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Receipt extends Model
{
    protected $table = 'receipts';

    protected $primaryKey = 'receipt_id';

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = [
        'receipt_name',
        'receipt_desc',
        'receipt_path',
        'expense_id',
    ];

    // relationships
    public function expense()
    {
        return $this->belongsTo(Expense::class, 'expense_id', 'expense_id');
    }

    public function mileages()
    {
        return $this->hasMany(Mileage::class, 'receipt_id', 'receipt_id');
    }
}
