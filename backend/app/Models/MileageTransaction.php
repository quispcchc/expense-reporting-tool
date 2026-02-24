<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MileageTransaction extends Model
{
    protected $table = 'mileage_transactions';

    protected $primaryKey = 'transaction_id';

    protected $fillable = [
        'mileage_id',
        'transaction_date',
        'distance_km',
        'meter_km',
        'parking_amount',
        'mileage_rate',
        'total_amount',
        'buyer',
        'travel_from',
        'travel_to',
    ];

    protected $casts = [
        'mileage_id' => 'integer',
        'transaction_date' => 'date',
        'distance_km' => 'float',
        'meter_km' => 'float',
        'parking_amount' => 'float',
        'mileage_rate' => 'float',
        'total_amount' => 'float',
    ];

    public function mileage()
    {
        return $this->belongsTo(Mileage::class, 'mileage_id', 'mileage_id');
    }

    public function receipts()
    {
        return $this->hasMany(MileageReceipt::class, 'transaction_id', 'transaction_id');
    }

    /**
     * Calculate total amount: distance * rate + parking + meter
     */
    public static function calculateTotal(float $distance, float $rate, ?float $parking = 0, ?float $meter = 0): float
    {
        return round(($distance * $rate) + ($parking ?? 0) + ($meter ?? 0), 2);
    }
}
