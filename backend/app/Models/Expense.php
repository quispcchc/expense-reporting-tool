<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $table = 'expense';
    protected $primaryKey = 'expense_id';
    public $incrementing = false;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'buyer_name',
        'vendor_name',
        'transaction_date',
        'transaction_desc',
        'expense_amount',
        'receipt_id',
        'tag_id',
        'approval_status_id',
        'claim_id',
        'team_id',
        'project_id',
        'cost_centre_id',
    ];


    //Relationships
    public function receipt()
    {
        return $this->belongsTo(Receipt::class, 'receipt_id', 'receipt_id');
    }

    public function tag()
    {
        return $this->belongsTo(Tag::class, 'tag_id', 'tag_id');
    }

    public function approvalStatus()
    {
        return $this->belongsTo(ApprovalStatus::class, 'approval_status_id', 'approval_status_id');
    }

    public function claim()
    {
        return $this->belongsTo(Claim::class, 'claim_id', 'claim_id');
    }
//
//    public function mileage()
//    {
//        return $this->belongsTo(Mileage::class, 'mileage_id', 'mileage_id');
//    }

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id', 'team_id');
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
