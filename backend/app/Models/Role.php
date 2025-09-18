<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    // Use the exact table name
    protected $table = 'role';

    // Use your custom primary key
    protected $primaryKey = 'role_id';

    // The primary key is not auto-incrementing
    public $incrementing = false;

    // It's an integer key, not a string/UUID
    protected $keyType = 'int';

    // Disable timestamps since your table doesn't have created_at/updated_at
    public $timestamps = false;

    // Allow mass assignment on these fields
    protected $fillable = [
        'role_id',
        'active_status_id',
        'role_name',
        'role_level',
        'role_desc',
    ];


    public function activeStatus()
    {
        return $this->belongsTo(ActiveStatus::class, 'active_status_id');
    }


    public function users()
    {
        return $this->hasMany(User::class, 'role_id', 'role_id');
    }
}   
