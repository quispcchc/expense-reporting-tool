<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Mileage;

class MileageTransaction extends Model
{
    protected $table = 'mileage_transaction';
    protected $primaryKey = 'transaction_id';

    protected $fillable = [
        'mileage_id',
        'transaction_date',
        'distance_km',
        'meter_km',
        'parking_amount',
        'buyer',
    ];

    protected $casts = [
        'mileage_id' => 'integer',
        'transaction_date' => 'date',
        'distance_km' => 'float',
        'meter_km' => 'float',
        'parking_amount' => 'float',
    ];

    public function mileage()
    {
        return $this->belongsTo(Mileage::class, 'mileage_id', 'mileage_id');
    }

    public function receipts()
    {
        return $this->hasMany(MileageReceipt::class, 'transaction_id', 'transaction_id');
    }
}
