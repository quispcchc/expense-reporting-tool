<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActiveStatus extends Model
{
    use HasFactory;
    // Custom table name (non-standard, singular)
    protected $table = 'active_status';

    // Custom primary key
    protected $primaryKey = 'active_status_id';

    // Non-incrementing (you're not using auto-increment)
    public $incrementing = false;

    // It's an integer, not a UUID
    protected $keyType = 'int';

    // No timestamps in your migration
    public $timestamps = false;

    // Mass assignable fields
    protected $fillable = [
        'active_status_id',
        'active_status_name',
    ];
    //Relationships
    public function roles()
    {
        return $this->hasMany(Role::class, 'active_status_id', 'active_status_id');
    }
    public function projects()
    {
        return $this->hasMany(Project::class, 'active_status_id', 'active_status_id');
    }

}
