<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Receipt extends Model
{
    protected $table = 'receipt';
    protected $primaryKey = 'receipt_id';
    public $incrementing = false;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'receipt_id',
        'receipt_name',
        'receipt_desc',
        'receipt_path',
    ];
    //relationships
    public function expenses() { 
        return $this->hasMany(Expense::class, 'receipt_id', 'receipt_id'); 
    }
    public function mileages() { 
        return $this->hasMany(Mileage::class, 'receipt_id', 'receipt_id'); 
    }
}
