<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClaimStatus extends Model
{
    protected $table = 'claim_status';

    protected $primaryKey = 'claim_status_id';

    public $incrementing = false;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = [
        'claim_status_id',
        'claim_status_name',
        'claim_status_desc',
    ];

    public function claims()
    {
        return $this->hasMany(Claim::class, 'claim_status_id', 'claim_status_id');
    }
}
