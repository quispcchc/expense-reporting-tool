<?php

namespace App\Http\Controllers;

use App\Models\MileageReceipt;
use App\Models\MileageTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MileageReceiptController extends Controller
{
    // Add one or more receipts to a transaction
    public function storeForTransaction(Request $request, $transactionId)
    {
        $request->validate([
            'receipts' => ['required', 'array','min:1'],
            'receipts.*' => ['file', 'mimes:pdf,jpeg,jpg,png', 'max:20480'],
        ]);

        return DB::transaction(function () use ($request, $transactionId) {
            $tx = MileageTransaction::findOrFail($transactionId);
            $created = [];
            $files = $request->file('receipts', []);
            foreach ($files as $file) {
                $path = $file->store('mileage_receipts', 'public');

                $created[] = MileageReceipt::create([
                    'transaction_id' => $tx->transaction_id,
                    'file_name' => $file->getClientOriginalName(),
                    'file_type' => $file->getClientMimeType(),
                    'file_path' => $path,
                ]);
            }

            return response()->json([
                'receipts' => $created,
            ], 201);
        });
    }
    public function update(Request $request, $receiptId)
    {
        $request->validate([
            // single file field named "receipt"
            'receipt' => ['required', 'file', 'mimes:pdf,jpeg,jpg,png', 'max:20480'],
        ]);

        return DB::transaction(function () use ($request, $receiptId) {
            $receipt = MileageReceipt::findOrFail($receiptId);

            // delete old file (if exists)
            if (!empty($receipt->file_path)) {
                Storage::disk('public')->delete($receipt->file_path);
            }

            // store new file
            $file = $request->file('receipt');
            $path = $file->store('mileage_receipts', 'public');

            // update DB row
            $receipt->update([
                'file_name' => $file->getClientOriginalName(),
                'file_type' => $file->getClientMimeType(),
                'file_path' => $path,
            ]);

            return response()->json(['receipt' => $receipt], 200);
        });
    }

    public function destroy($receiptId)
    {
        $receipt = MileageReceipt::findOrFail($receiptId);
        Storage::disk('public')->delete($receipt->file_path);
        $receipt->delete();

        return response()->json(['message' => 'Receipt deleted'], 200);
    }
    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'receipt_ids' => ['required', 'array', 'min:1'],
            'receipt_ids.*' => ['integer', 'exists:mileage_receipt,receipt_id'],
        ]);

        return DB::transaction(function () use ($validated) {
            $receipts = MileageReceipt::whereIn('receipt_id', $validated['receipt_ids'])->get();

            foreach ($receipts as $r) {
                Storage::disk('public')->delete($r->file_path);
            }

            MileageReceipt::whereIn('receipt_id', $validated['receipt_ids'])->delete();

            return response()->json(['message' => 'Receipts deleted'], 200);
        });
    }
}