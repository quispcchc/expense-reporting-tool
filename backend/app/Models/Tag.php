<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tag extends Model
{
    protected $table = 'tag';
    protected $primaryKey = 'tag_id';
    public $incrementing = false;
    protected $keyType = 'int';
    public $timestamps = false;

    protected $fillable = [
        'tag_id',
        'active_status_id',
        'tag_name',
        'tag_desc',
    ];
    public function activeStatus()
    {
        return $this->belongsTo(ActiveStatus::class, 'active_status_id', 'active_status_id');
    }
}
