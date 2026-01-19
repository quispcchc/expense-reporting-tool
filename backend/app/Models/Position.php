<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Position extends Model
{
    use HasFactory;

    protected $table = 'positions';

    protected $primaryKey = 'position_id';

    public $incrementing = true;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = [
        'position_id',
        'active_status_id',
        'position_name',
        'position_desc',
    ];

    // relationship
    public function activeStatus()
    {
        return $this->belongsTo(ActiveStatus::class, 'active_status_id', 'active_status_id');
    }

    public function claims()
    {
        return $this->hasMany(Claim::class, 'position_id', 'position_id');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'position_id', 'position_id');
    }
}
