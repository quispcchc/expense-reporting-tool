<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Contracts\Auth\CanResetPassword;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens ;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */

    public $timestamps=false;

    protected $primaryKey = 'user_id';
    protected $fillable = [
        'user_id',
        'email',
        'first_name',
        'last_name',
        'user_pass',
        'active_status_id',
        'team_id',
        'position_id',
        'role_id',
        'email_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'first_name',
        'last_name',
        'user_pass',
        'role_id',
        'position_id',
    ];

    protected $appends = [
        'full_name',
        'role_name',
        'team_name',
    ];
    //accessors to get full name, role name, and team name
    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function getRoleNameAttribute()
    {
        return $this->role?->role_name;
    }

    public function getTeamNameAttribute()
    {
        return $this->team?->team_name;
    }


    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
    //Define relationships with other models

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id', 'role_id');
    }

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id', 'team_id');
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

