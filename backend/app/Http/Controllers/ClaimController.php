<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Models\Expense;
use App\Models\Mileage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ClaimController extends Controller
{
    /**
     * Store a new claim with optional expenses and mileage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id'         => 'required|integer|exists:users,user_id',
            'position_id'     => 'required|integer|exists:position,position_id',
            'claim_type_id'   => 'required|integer|exists:claim_type,claim_type_id',
            'claim_notes'     => 'nullable|string',
            'claim_status_id' => 'required|integer',
            'expenses'        => 'nullable|array',
            'mileage'         => 'nullable|array',
        ]);

        DB::beginTransaction();

        try {
            $claim = Claim::create([
                'user_id'         => $validated['user_id'],
                'position_id'     => $validated['position_id'],
                'claim_type_id'   => $validated['claim_type_id'],
                'claim_notes'     => $validated['claim_notes'] ?? null,
                'claim_submitted' => now(),
                'claim_status_id' => $validated['claim_status_id'],
            ]);

            // Save mileage if provided
            if (isset($validated['mileage'])) {
                $mileage = Mileage::create($validated['mileage']);
                $claim->update(['mileage_id' => $mileage->mileage_id]);
            }

            // Save each expense if provided
            if (isset($validated['expenses']) && is_array($validated['expenses'])) {
                foreach ($validated['expenses'] as $expenseData) {
                    $expenseData['claim_id'] = $claim->claim_id;
                    Expense::create($expenseData);
                }
            }

            DB::commit();

            return response()->json(['message' => 'Claim submitted successfully', 'claim_id' => $claim->claim_id], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Error creating claim: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to submit claim'], 500);
        }
    }
}
