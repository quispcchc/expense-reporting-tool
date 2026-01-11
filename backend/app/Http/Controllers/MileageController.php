<?php

namespace App\Http\Controllers;

use App\Models\Mileage;
use Illuminate\Http\Request;

class MileageController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'claim_id' => 'required|integer|exists:claim,claim_id',
            'period_of_from' => 'required|date',
            'period_of_to' => 'required|date|after_or_equal:period_of_from',
            'transaction_date' => 'required|date',
            'distance_km' => 'required|numeric',
            'meter_km' => 'nullable|numeric',
            'parking_amount' => 'nullable|numeric',
            'receipt_id' => 'nullable|integer',
        ]);

        $mileage = Mileage::create($validated);

        return response()->json(['message' => 'Mileage recorded', 'mileage' => $mileage]);
    }
}
