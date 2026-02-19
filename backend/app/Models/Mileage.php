<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mileage extends Model
{
    protected $table = 'mileage';

    protected $primaryKey = 'mileage_id';

    protected $fillable = [
        'expense_id',
        'travel_from',
        'travel_to',
        'period_of_from',
        'period_of_to',
    ];

    protected $casts = [
        'expense_id' => 'integer',
        'period_of_from' => 'date',
        'period_of_to' => 'date',
    ];

    public function expense()
    {
        return $this->belongsTo(Expense::class, 'expense_id', 'expense_id');
    }

    public function transactions()
    {
        return $this->hasMany(MileageTransaction::class, 'mileage_id', 'mileage_id');
    }
}
