<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $table = 'expenses';

    protected $primaryKey = 'expense_id';

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = [
        'buyer_name',
        'vendor_name',
        'transaction_date',
        'expense_amount',
        'transaction_desc',
        'transaction_notes',
        'approval_status_id',
        'claim_id',
        'project_id',
        'cost_centre_id',
        'account_number_id',
        'cost_centre_code_snapshot',
        'cost_centre_description_snapshot',
        'account_number_snapshot',
        'project_name_snapshot',
    ];

    protected $appends = [
        'cost_centre_code',
        'cost_centre_description',
        'account_number_display',
        'project_name_display',
    ];

    // Accessors to handle snapshots (fallback if master data is deleted)
    public function getCostCentreCodeAttribute()
    {
        return $this->cost_centre_code_snapshot ?? $this->costCentre?->cost_centre_code;
    }

    public function getCostCentreDescriptionAttribute()
    {
        return $this->cost_centre_description_snapshot ?? $this->costCentre?->description;
    }

    public function getAccountNumberDisplayAttribute()
    {
        return $this->account_number_snapshot ?? $this->accountNumber?->account_number;
    }

    public function getProjectNameDisplayAttribute()
    {
        return $this->project_name_snapshot ?? $this->project?->project_name;
    }

    // Relationships
    public function mileage()
    {
        return $this->hasOne(Mileage::class, 'expense_id', 'expense_id');
    }

    public function receipts()
    {
        return $this->hasMany(Receipt::class, 'expense_id', 'expense_id');
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'expense_tag', 'expense_id', 'tag_id');
    }

    public function approvalStatus()
    {
        return $this->belongsTo(ApprovalStatus::class, 'approval_status_id', 'approval_status_id');
    }

    public function claim()
    {
        return $this->belongsTo(Claim::class, 'claim_id', 'claim_id');
    }

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id', 'team_id');
    }

    public function accountNumber()
    {
        return $this->belongsTo(AccountNumber::class, 'account_number_id', 'account_number_id');
    }

    public function project()
    {
        return $this->belongsTo(Project::class, 'project_id', 'project_id');
    }

    public function costCentre()
    {
        return $this->belongsTo(CostCentre::class, 'cost_centre_id', 'cost_centre_id');
    }
}
