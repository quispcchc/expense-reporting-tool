<?php

namespace App\Http\Controllers;

use App\Models\MileageTransaction;
use App\Models\MileageReceipt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MileageTransactionController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            // MUST NOT be nullable
            'mileage_id' => ['required', 'integer', 'exists:mileage,mileage_id'],

            'transaction_date' => ['required', 'date'],
            'distance_km' => ['required', 'numeric', 'min:0'],
            'meter_km' => ['nullable', 'numeric', 'min:0'],
            'parking_amount' => ['nullable', 'numeric', 'min:0'],
            'buyer' => ['nullable', 'string', 'max:255'],

            // receipts should usually be optional (not always required)
            'receipts' => ['nullable', 'array'],
            'receipts.*' => ['file', 'mimes:pdf,jpeg,jpg,png', 'max:20480'],
        ]);

        return DB::transaction(function () use ($request, $validated) {
            $transaction = MileageTransaction::create(
                collect($validated)->except('receipts')->toArray()
            );

            if ($request->hasFile('receipts')) {
                foreach ($request->file('receipts') as $file) {
                    $path = $file->store('mileage_receipts', 'public');

                    MileageReceipt::create([
                        'transaction_id' => $transaction->transaction_id,
                        'file_name' => $file->getClientOriginalName(),
                        'file_type' => $file->getClientMimeType(),
                        'file_path' => $path,
                    ]);
                }
            }

            return response()->json(['transaction' => $transaction->load('receipts')], 201);
        });
    }

    public function update(Request $request, $transactionId)
    {
        $validated = $request->validate([
            'transaction_date' => ['required', 'date'],
            'distance_km' => ['required', 'numeric', 'min:0'],
            'meter_km' => ['nullable', 'numeric', 'min:0'],
            'parking_amount' => ['nullable', 'numeric', 'min:0'],
            'buyer' => ['nullable', 'string', 'max:255'],

            'receipts' => ['nullable', 'array'],
            'receipts.*' => ['file', 'mimes:pdf,jpeg,jpg,png', 'max:20480'],
        ]);

        return DB::transaction(function () use ($request, $validated, $transactionId) {
            $transaction = MileageTransaction::findOrFail($transactionId);
            $transaction->update(collect($validated)->except('receipts')->toArray());

            // Optional: add new receipts during update
            if ($request->hasFile('receipts')) {
                foreach ($request->file('receipts') as $file) {
                    $path = $file->store('mileage_receipts', 'public');

                    MileageReceipt::create([
                        'transaction_id' => $transaction->transaction_id,
                        'file_name' => $file->getClientOriginalName(),
                        'file_type' => $file->getClientMimeType(),
                        'file_path' => $path,
                    ]);
                }
            }

            return response()->json(['transaction' => $transaction->load('receipts')], 200);
        });
    }

    public function destroy($transactionId)
    {
        $transaction = MileageTransaction::findOrFail($transactionId);
        $transaction->delete();

        return response()->json(['message' => 'Transaction deleted'], 200);
    }
}
