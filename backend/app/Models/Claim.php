<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Claim extends Model
{
    protected $table = 'claims';

    protected $primaryKey = 'claim_id';

    protected $keyType = 'int';

    const STATUS_PENDING = 1;

    const STATUS_APPROVED = 2;

    const STATUS_REJECTED = 3;

    protected $fillable = [
        'user_id',
        'position_id',
        'department_id',
        'team_id',
        'claim_submitted',
        'claim_type_id',
        'claim_status_id',
        'total_amount',
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

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class, 'claim_id', 'claim_id');
    }

    public function mileage()
    {
        return $this->hasManyThrough(
            Mileage::class,
            Expense::class,
            'claim_id',   // FK on expenses pointing to claims
            'expense_id', // FK on mileage pointing to expenses
            'claim_id',   // local key on claims
            'expense_id'  // local key on expenses
        );
    }

    public function status()
    {
        return $this->belongsTo(ClaimStatus::class, 'claim_status_id', 'claim_status_id');
    }

    public function position()
    {
        return $this->belongsTo(Position::class, 'position_id');
    }

    public function claimNotes()
    {
        return $this->hasMany(ClaimNote::class, 'claim_id');
    }

    public function notes()
    {
        return $this->hasMany(ClaimNote::class, 'claim_id', 'claim_id');
    }

    public function claimApprovals()
    {
        return $this->hasMany(\App\Models\ClaimApproval::class, 'claim_id', 'claim_id');
    }
}
