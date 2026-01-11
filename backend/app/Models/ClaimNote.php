<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClaimNote extends Model
{
    protected $table = 'claim_notes';

    protected $primaryKey = 'claim_note_id';

    protected $fillable = [
        'claim_note_text',
        'claim_id',
        'user_id',
    ];

    public function claim()
    {
        return $this->belongsTo(Claim::class, 'claim_id', 'claim_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
