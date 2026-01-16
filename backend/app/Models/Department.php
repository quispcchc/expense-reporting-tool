<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $table = 'departments';

    protected $primaryKey = 'department_id';

    protected $fillable = [
        'department_name',
        'department_abbreviation',
        'active_status_id',
    ];

    public function activeStatus()
    {
        return $this->belongsTo(ActiveStatus::class, 'active_status_id', 'active_status_id');
    }

    public function teams()
    {
        return $this->hasMany(Team::class, 'department_id', 'department_id');
    }

    public function costCentres()
    {
        return $this->hasMany(CostCentre::class, 'department_id', 'department_id');
    }
}
