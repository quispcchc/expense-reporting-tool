<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use App\Models\MileageReceipt;
use App\Models\MileageTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MileageTransactionController extends Controller
{
    /**
     * Recalculate the parent expense amount and claim total
     * based on the sum of all sibling mileage transactions.
     */
    private function syncExpenseAndClaimTotals(MileageTransaction $transaction): void
    {
        $mileage = $transaction->mileage;
        if (!$mileage) return;

        $expense = $mileage->expense;
        if (!$expense) return;

        // Sum all mileage transaction totals → update expense amount
        $newExpenseAmount = $mileage->transactions()->sum('total_amount');
        $expense->update(['expense_amount' => $newExpenseAmount]);

        // Sum all expense amounts → update claim total
        $claim = $expense->claim;
        if ($claim) {
            $newClaimTotal = $claim->expenses()->sum('expense_amount');
            $claim->update(['total_amount' => $newClaimTotal]);
        }
    }

    /**
     * Create a mileage transaction with optional receipts.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'mileage_id' => 'required|integer|exists:mileage,mileage_id',
            'transaction_date' => 'required|date',
            'distance_km' => 'required|numeric|min:0',
            'meter_km' => 'nullable|numeric',
            'parking_amount' => 'nullable|numeric',
            'buyer' => 'nullable|string',
            'travel_from' => 'nullable|string|max:255',
            'travel_to' => 'nullable|string|max:255',
            'files.*' => 'file|mimes:pdf,png,jpg,jpeg|max:20480',
        ]);

        $rate = (float) AppSetting::getValue('mileage_rate', 0.5);
        $totalAmount = MileageTransaction::calculateTotal(
            (float) $validated['distance_km'],
            $rate,
            (float) ($validated['parking_amount'] ?? 0),
            (float) ($validated['meter_km'] ?? 0)
        );

        $transaction = MileageTransaction::create([
            'mileage_id' => $validated['mileage_id'],
            'transaction_date' => $validated['transaction_date'],
            'distance_km' => $validated['distance_km'],
            'meter_km' => $validated['meter_km'] ?? null,
            'parking_amount' => $validated['parking_amount'] ?? null,
            'mileage_rate' => $rate,
            'total_amount' => $totalAmount,
            'buyer' => $validated['buyer'] ?? null,
            'travel_from' => $validated['travel_from'] ?? null,
            'travel_to' => $validated['travel_to'] ?? null,
        ]);

        // Handle file uploads
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $path = $file->store('mileage_receipts', 'public');
                MileageReceipt::create([
                    'transaction_id' => $transaction->transaction_id,
                    'file_name' => $file->getClientOriginalName(),
                    'file_type' => $file->getClientMimeType(),
                    'file_path' => $path,
                ]);
            }
        }

        return $this->successResponse(
            $transaction->load('receipts'),
            'Mileage transaction created',
            201
        );
    }

    /**
     * Update a mileage transaction and optionally manage receipts.
     */
    public function update(Request $request, $transactionId)
    {
        $validated = $request->validate([
            'transaction_date' => 'sometimes|date',
            'distance_km' => 'sometimes|numeric|min:0',
            'meter_km' => 'nullable|numeric',
            'parking_amount' => 'nullable|numeric',
            'buyer' => 'nullable|string',
            'travel_from' => 'nullable|string|max:255',
            'travel_to' => 'nullable|string|max:255',
            'files.*' => 'file|mimes:pdf,png,jpg,jpeg|max:20480',
            'deleteReceiptIds' => 'nullable|string',
            'deleteAttachment' => 'nullable|string',
        ]);

        $transaction = MileageTransaction::findOrFail($transactionId);

        // Update fields
        $updateData = array_intersect_key($validated, array_flip([
            'transaction_date', 'distance_km', 'meter_km', 'parking_amount', 'buyer', 'travel_from', 'travel_to',
        ]));

        if (! empty($updateData)) {
            $transaction->update($updateData);
        }

        // Recalculate total
        $transaction->total_amount = MileageTransaction::calculateTotal(
            (float) $transaction->distance_km,
            (float) $transaction->mileage_rate,
            (float) ($transaction->parking_amount ?? 0),
            (float) ($transaction->meter_km ?? 0)
        );
        $transaction->save();

        // Handle receipt deletions by IDs
        $deleteReceiptIds = $validated['deleteReceiptIds'] ?? null;
        if ($deleteReceiptIds) {
            $receiptIds = array_map('trim', explode(',', $deleteReceiptIds));
            foreach ($receiptIds as $receiptId) {
                $receipt = MileageReceipt::find($receiptId);
                if ($receipt && $receipt->transaction_id == $transactionId) {
                    Storage::disk('public')->delete($receipt->file_path);
                    $receipt->delete();
                }
            }
        }

        // Handle delete all attachments
        $deleteAttachment = isset($validated['deleteAttachment']) && ($validated['deleteAttachment'] === 'true' || $validated['deleteAttachment'] === '1');
        if ($deleteAttachment) {
            foreach ($transaction->receipts as $receipt) {
                Storage::disk('public')->delete($receipt->file_path);
                $receipt->delete();
            }
        }

        // Handle new file uploads
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $path = $file->store('mileage_receipts', 'public');
                MileageReceipt::create([
                    'transaction_id' => $transaction->transaction_id,
                    'file_name' => $file->getClientOriginalName(),
                    'file_type' => $file->getClientMimeType(),
                    'file_path' => $path,
                ]);
            }
        }

        $this->syncExpenseAndClaimTotals($transaction);

        return $this->successResponse(
            $transaction->fresh('receipts'),
            'Mileage transaction updated'
        );
    }

    /**
     * Delete a mileage transaction and its receipts.
     */
    public function destroy($transactionId)
    {
        $transaction = MileageTransaction::findOrFail($transactionId);

        // Delete receipt files
        foreach ($transaction->receipts as $receipt) {
            Storage::disk('public')->delete($receipt->file_path);
            $receipt->delete();
        }

        $transaction->delete();

        return $this->successResponse(null, 'Mileage transaction deleted');
    }
}
