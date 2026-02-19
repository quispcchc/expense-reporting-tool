<?php

namespace App\Http\Controllers;

use App\Models\Mileage;
use Illuminate\Http\Request;

class MileageController extends Controller
{
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
