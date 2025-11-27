<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClaimType extends Model
{
    protected $table = 'claim_types';
    protected $primaryKey = 'claim_type_id';
    public $incrementing = false;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'claim_type_id',
        'active_status_id',
        'claim_type_name',
        'claim_type_desc',
    ];
    //relationships
    public function activeStatus() {
        return $this->belongsTo(ActiveStatus::class, 'active_status_id', 'active_status_id');
    }
    public function claims() {
        return $this->hasMany(Claim::class, 'claim_type_id', 'claim_type_id');
    }
}
