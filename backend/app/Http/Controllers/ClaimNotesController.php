<?php

namespace App\Http\Controllers;

use App\Models\ClaimNote;
use Illuminate\Http\Request;

class ClaimNotesController extends Controller
{
    //
    public function store(Request $request)
    {
        $claimNote = ClaimNote::create([
            'claim_id' => $request->claim_id,
            'user_id' => $request->user()->user_id,
            'claim_note_text' => $request->noteText,
        ]);

        return response()->json($claimNote->load(['user']));

    }
}
