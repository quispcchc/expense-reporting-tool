<?php

namespace App\Http\Controllers;

use App\Models\Mileage;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MileageController extends Controller
{
    // Create mileage header (1 per claim)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'claim_id' => ['required', 'integer', 'exists:claims,claim_id',
                // enforce 1 mileage per claim (optional but recommended)
                Rule::unique('mileage', 'claim_id')
            ],
            'travel_from' => ['required', 'string', 'max:255'],
            'travel_to' => ['required', 'string', 'max:255'],
            'period_of_from' => ['required', 'date'],
            'period_of_to' => ['required', 'date', 'after_or_equal:period_of_from'],
        ]);

        $mileage = Mileage::create($validated);

        return response()->json(['mileage' => $mileage], 201);
    }

    // Get mileage header + transactions + receipts by claim id
    public function showByClaim($claimId)
    {
        $mileage = Mileage::with('transactions.receipts')
            ->where('claim_id', $claimId)
            ->first();

        return response()->json(['mileage' => $mileage], 200);
    }

    // Update mileage header (full payload or partial—your choice)
    public function update(Request $request, $mileageId)
    {
        $validated = $request->validate([
            'travel_from' => ['required', 'string', 'max:255'],
            'travel_to' => ['required', 'string', 'max:255'],
            'period_of_from' => ['required', 'date'],
            'period_of_to' => ['required', 'date', 'after_or_equal:period_of_from'],
        ]);

        $mileage = Mileage::findOrFail($mileageId);
        $mileage->update($validated);

        return response()->json(['mileage' => $mileage], 200);
    }

    // Delete mileage header
    public function destroy($mileageId)
    {
        $mileage = Mileage::findOrFail($mileageId);
        $mileage->delete();

        return response()->json(['message' => 'Mileage deleted'], 200);
    }
}
