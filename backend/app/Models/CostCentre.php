<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CostCentre extends Model
{
    protected $table = 'cost_centre';
    protected $primaryKey = 'cost_centre_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'cost_centre_code',
        'active_status_id',
        'description',
        'team_id',
    ];
    //relationships
    public function activeStatus() {
        return $this->belongsTo(ActiveStatus::class, 'active_status_id', 'active_status_id');
    }
    public function team() {
        return $this->belongsTo(Team::class, 'team_id', 'team_id');
    }
    public function expenses() {
        return $this->hasMany(Expense::class, 'cost_centre_id', 'cost_centre_id');
    }
}
