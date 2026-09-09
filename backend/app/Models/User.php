<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    public $timestamps = true;

    protected $primaryKey = 'user_id';

    protected $fillable = [
        'user_id',
        'email',
        'first_name',
        'last_name',
        'user_pass',
        'active_status_id',
        'department_id',
        'role_id',
        'can_self_approve',
        'position_id',
        'email_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'user_pass',
        'role_id',
        'position_id',
    ];

    protected $appends = [
        'full_name',
        'role_name',
        'department_name',
        'position_name',
    ];

    // accessors to get full name, role name, and team name
    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function getRoleNameAttribute()
    {
        return $this->role?->role_name;
    }

    public function getDepartmentNameAttribute()
    {
        return $this->department?->department_name;
    }

    public function getPositionNameAttribute()
    {
        return $this->position?->position_name;
    }

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'can_self_approve' => 'boolean',
    ];

    /**
     * The "booted" method of the model.
     *
     * @return void
     */
    protected static function booted()
    {
        static::deleting(function ($user) {
            // Nullify user references instead of cascading delete to preserve historical data
            $user->claims()->update(['user_id' => null]);
            $user->approvedClaims()->update(['approved_by' => null]);
            
            // For claim notes, we might want to keep the text but lose the author info
            ClaimNote::where('user_id', $user->user_id)->update(['user_id' => null]);
            
            // Detach from teams (pivot table usually has cascade delete but being explicit is safer)
            $user->teams()->detach();
        });
    }

    // Define relationships with other models

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id', 'role_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'department_id');
    }

    public function teams()
    {
        return $this->belongsToMany(Team::class, 'team_user', 'user_id', 'team_id')->withTimestamps();
    }

    public function activeStatus()
    {
        return $this->belongsTo(ActiveStatus::class, 'active_status_id', 'active_status_id');
    }

    public function position()
    {
        return $this->belongsTo(Position::class, 'position_id', 'position_id');
    }

    public function claims()
    {
        return $this->hasMany(Claim::class, 'user_id', 'user_id');
    }

    public function approvedClaims()
    {
        return $this->hasMany(ClaimApproval::class, 'approved_by', 'user_id');
    }
}
