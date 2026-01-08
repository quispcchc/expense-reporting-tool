<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApprovalStatus extends Model
{
    protected $table = 'approval_status';

    protected $primaryKey = 'approval_status_id';

    public $incrementing = false;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = [
        'approval_status_id',
        'approval_status_name',
        'approval_status_desc',
    ];
    //relationships
    public function expenses()
    {
        return $this->hasMany(Expense::class, 'approval_status_id', 'approval_status_id');
    }
    public function claimApprovals() 
    { 
        return $this->hasMany(ClaimApproval::class, 'approval_status_id', 'approval_status_id'); 
    }

}
