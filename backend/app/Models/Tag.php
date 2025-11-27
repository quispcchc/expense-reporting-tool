<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tag extends Model
{
    protected $table = 'tags';
    protected $primaryKey = 'tag_id';
    protected $keyType = 'int';

    protected $fillable = [
        'tag_id',
        'tag_name',
    ];

    public function expenses()
    {
        return $this->belongsToMany(Expense::class, 'expense_tag', 'tag_id', 'expense_id');
    }
}
