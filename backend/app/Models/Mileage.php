<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mileage extends Model
{
    protected $table = 'mileage';

    protected $primaryKey = 'mileage_id';

    public $incrementing = false;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = [
        'mileage_id',
        'period_of_from',
        'period_of_to',
        'transaction_date',
        'distance_km',
        'meter_km',
        'parking_amount',
        'receipt_id',
    ];

    // relationships
    public function receipt()
    {
        return $this->belongsTo(Receipt::class, 'receipt_id', 'receipt_id');
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class, 'mileage_id', 'mileage_id');
    }
}
