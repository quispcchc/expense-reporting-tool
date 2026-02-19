<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MileageReceipt extends Model
{
    protected $table = 'mileage_receipts';

    protected $primaryKey = 'receipt_id';

    protected $fillable = [
        'transaction_id',
        'file_name',
        'file_type',
        'file_path',
    ];

    protected $casts = [
        'transaction_id' => 'integer',
    ];

    public function transaction()
    {
        return $this->belongsTo(MileageTransaction::class, 'transaction_id', 'transaction_id');
    }
}
