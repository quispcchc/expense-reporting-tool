<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClaimApproval extends Model
{
    protected $table = 'claim_approval';

    protected $primaryKey = 'claim_approval_id';

    public $incrementing = true;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = [
        'claim_approval_id',
        'claim_id',
        'claim_approval_details',
        'approval_status_id',
        'approved_by',
    ];

    // Relationships

    public function claim()
    {
        return $this->belongsTo(Claim::class, 'claim_id', 'claim_id');
    }

    public function approvalStatus()
    {
        return $this->belongsTo(ApprovalStatus::class, 'approval_status_id', 'approval_status_id');
    }

    public function approvedByUser()
    {
        return $this->belongsTo(User::class, 'approved_by', 'user_id');
    }
}
