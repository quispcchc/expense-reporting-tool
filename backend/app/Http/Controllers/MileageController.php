<?php

namespace App\Http\Controllers;

use App\Models\Mileage;
use Illuminate\Http\Request;

class MileageController extends Controller
{
    /**
     * Get all mileage records (with transactions and receipts) for a claim.
     * Mileage is now linked per-expense, so a claim may have multiple records.
     */
    public function showByClaim($claimId)
    {
        $mileage = Mileage::whereHas('expense', fn ($q) => $q->where('claim_id', $claimId))
            ->with(['transactions.receipts'])
            ->get();

        return $this->successResponse($mileage->isEmpty() ? null : $mileage);
    }

    /**
     * Update mileage header (travel details, period).
     */
    public function update(Request $request, $mileageId)
    {
        $validated = $request->validate([
            'travel_from' => 'sometimes|string|max:255',
            'travel_to' => 'sometimes|string|max:255',
            'period_of_from' => 'sometimes|date',
            'period_of_to' => 'sometimes|date',
        ]);

        $mileage = Mileage::findOrFail($mileageId);
        $mileage->update($validated);

        return $this->successResponse(
            $mileage->load('transactions.receipts'),
            'Mileage updated'
        );
    }

    /**
     * Delete mileage and all transactions/receipts (cascades).
     */
    public function destroy($mileageId)
    {
        $mileage = Mileage::findOrFail($mileageId);
        $mileage->delete();

        return $this->successResponse(null, 'Mileage deleted');
    }
}
