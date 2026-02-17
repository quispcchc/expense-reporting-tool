<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mileage extends Model
{
    protected $table = 'mileage';

    protected $primaryKey = 'mileage_id';

    protected $fillable = [
        'claim_id',
        'travel_from',
        'travel_to',
        'period_of_from',
        'period_of_to',
    ];

    protected $casts = [
        'claim_id' => 'integer',
        'period_of_from' => 'date',
        'period_of_to' => 'date',
    ];

    public function claim()
    {
        return $this->belongsTo(Claim::class, 'claim_id', 'claim_id');
    }

    public function transactions()
    {
        return $this->hasMany(MileageTransaction::class, 'mileage_id', 'mileage_id');
    }
}
