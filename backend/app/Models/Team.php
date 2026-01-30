<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    use HasFactory;

    protected $table = 'teams';

    protected $primaryKey = 'team_id';

    public $incrementing = false;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = [
        'team_id',
        'team_name',
        'team_abbreviation',
        'team_desc',
        'active_status_id',
        'department_id',
    ];

    // relationships
    public function activeStatus()
    {
        return $this->belongsTo(ActiveStatus::class, 'active_status_id', 'active_status_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'department_id');
    }
}
