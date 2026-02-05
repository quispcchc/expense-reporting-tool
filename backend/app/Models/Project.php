<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $table = 'projects';

    protected $primaryKey = 'project_id';

    public $incrementing = true;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = [
        'project_id',
        'active_status_id',
        'project_name',
        'project_desc',
        'department_id',
    ];

    // Mutator to capitalize every word in project_name
    public function setProjectNameAttribute($value)
    {
        $this->attributes['project_name'] = ucwords(strtolower($value));
    }

    // relationships
    public function activeStatus()
    {
        return $this->belongsTo(ActiveStatus::class, 'active_status_id', 'active_status_id');
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class, 'project_id', 'project_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }
}
