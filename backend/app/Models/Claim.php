<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Claim extends Model
{
    protected $table = 'claim';
    protected $primaryKey = 'claim_id';
//    public $incrementing = false;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'position_id',
        'department_id',
        'claim_notes',
        'claim_submitted',
        'claim_type_id',
        'claim_status_id',
        'total_amount'
    ];

    // Relationships

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }


    public function claimType()
    {
        return $this->belongsTo(ClaimType::class, 'claim_type_id', 'claim_type_id');
    }

    public function department() {
        return $this->belongsTo(Department::class,'department_id');
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class, 'claim_id', 'claim_id');
    }

    public function mileage()
    {
        return $this->hasOne(Mileage::class, 'claim_id', 'claim_id');
    }

    public function status()
    {
        return $this->belongsTo(ClaimStatus::class, 'claim_status_id', 'claim_status_id');
    }
}
