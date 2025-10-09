<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $table = 'department';

    protected $fillable = [
        'department_name',
        'department_abbreviation',
    ];

    public function teams(){
        return $this->hasMany(Team::class, 'department_id', 'team_id');
    }

    public function costCentres(){
        return $this->hasMany(CostCentre::class,'department_id','cost_centre_id');
    }
}
