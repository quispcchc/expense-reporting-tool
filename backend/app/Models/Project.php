<?php 
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $table = 'project';
    protected $primaryKey = 'project_id';
    public $incrementing = false;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'project_id',
        'active_status_id',
        'project_name',
        'project_desc',
    ];
    //relationships
    public function activeStatus() { 
        return $this->belongsTo(ActiveStatus::class, 'active_status_id', 'active_status_id'); 
    }
    public function expenses() { 
        return $this->hasMany(Expense::class, 'project_id', 'project_id');
    }
}
