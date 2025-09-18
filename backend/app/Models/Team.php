<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    protected $table = 'team';
    protected $primaryKey = 'team_id';
    public $incrementing = false;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'team_id',
        'team_abbreviation',
        'active_status_id',
        'team_name',
        'team_desc',
    ];
    //relationships
    public function activeStatus() {
        return $this->belongsTo(ActiveStatus::class, 'active_status_id', 'active_status_id');
    }
}
