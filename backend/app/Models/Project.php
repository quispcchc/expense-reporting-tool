<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;
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
        'department_id'
    ];
    //relationships
    public function activeStatus() {
        return $this->belongsTo(ActiveStatus::class, 'active_status_id', 'active_status_id');
    }
    public function expenses() {
        return $this->hasMany(Expense::class, 'project_id', 'project_id');
    }

    public function  department() {
        return $this->belongsTo(Department::class,'department_id');
    }
}
