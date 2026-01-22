<?php

namespace App\Services;

use App\Enums\ClaimStatus;
use App\Models\Claim;
use App\Models\Expense;
use App\Models\Receipt;
use App\Notifications\ClaimUpdatedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ExpenseService
{
    public function approveExpense(int $expenseId)
    {
        DB::transaction(function () use ($expenseId) {
            $expense = Expense::findOrFail($expenseId);

            $expense->update(['approval_status_id' => ClaimStatus::APPROVED]);

            $this->updateClaimStatus($expense->claim_id);
        });
    }

    public function rejectExpense(int $expenseId)
    {
        DB::transaction(function () use ($expenseId) {
            $expense = Expense::findOrFail($expenseId);

            $expense->update(['approval_status_id' => ClaimStatus::REJECTED]);

            $this->updateClaimStatus($expense->claim_id);
        });
    }

    public function updateExpense(array $updatedExpense, int $expenseId)
    {
        return DB::transaction(function () use ($expenseId, $updatedExpense) {
            \Log::info('=== UPDATE EXPENSE START ===');
            \Log::info('Expense ID: '.$expenseId);
            \Log::info('Updated data keys: '.implode(', ', array_keys($updatedExpense)));
            \Log::info('RAW deleteAttachment value: '.print_r($updatedExpense['deleteAttachment'] ?? 'NOT SET', true));

            $expense = Expense::findOrFail($expenseId);

            // Handle files separately
            $files = $updatedExpense['files'] ?? null;
            $deleteReceiptIds = $updatedExpense['deleteReceiptIds'] ?? null;
            // Normalize if array form (e.g., deleteReceiptIds[])
            if (is_array($deleteReceiptIds)) {
                $deleteReceiptIds = implode(',', array_map('trim', $deleteReceiptIds));
            }

            // Convert deleteAttachment to boolean - handle both string "true"/"false" and actual boolean
            $deleteAttachment = false;
            if (isset($updatedExpense['deleteAttachment'])) {
                $value = $updatedExpense['deleteAttachment'];
                if (is_string($value)) {
                    $deleteAttachment = ($value === 'true' || $value === '1');
                } else {
                    $deleteAttachment = (bool) $value;
                }
            }

            \Log::info('Files present: '.(is_array($files) ? count($files) : 'no'));
            \Log::info('Delete attachment flag (converted): '.($deleteAttachment ? 'TRUE' : 'FALSE'));
            \Log::info('Delete receipt IDs: '.($deleteReceiptIds ?? 'none'));

            unset($updatedExpense['files']);
            unset($updatedExpense['deleteAttachment']);
            unset($updatedExpense['deleteReceiptIds']);

            // Update expense fields
            $expense->update($updatedExpense);
            \Log::info('Expense updated');

            // Handle individual receipt deletion by IDs
            if ($deleteReceiptIds) {
                $receiptIdsArray = array_map('trim', explode(',', $deleteReceiptIds));
                \Log::info('🗑️ DELETING specific receipts: '.implode(', ', $receiptIdsArray));

                foreach ($receiptIdsArray as $receiptId) {
                    $receipt = Receipt::find($receiptId);
                    if ($receipt && $receipt->expense_id == $expenseId) {
                        \Log::info('Deleting receipt file: '.$receipt->receipt_path);
                        Storage::disk('public')->delete($receipt->receipt_path);
                        $receipt->delete();
                        \Log::info('✅ Receipt deleted successfully');
                    }
                }
            }

            // Handle file deletion or upload
            if ($deleteAttachment) {
                \Log::info('🗑️ DELETING ALL attachments for expense: '.$expenseId);
                $receiptsCount = $expense->receipts()->count();
                \Log::info('Found '.$receiptsCount.' receipts to delete');

                // Delete ALL existing receipts
                if ($expense->receipts()->exists()) {
                    foreach ($expense->receipts as $receipt) {
                        \Log::info('Deleting receipt file: '.$receipt->receipt_path);
                        Storage::disk('public')->delete($receipt->receipt_path);
                        $receipt->delete();
                        \Log::info('✅ Receipt deleted successfully');
                    }
                } else {
                    \Log::info('⚠️ No receipts found to delete');
                }
            }

            // Upload new files (append to existing receipts)
            if (is_array($files) && count($files) > 0) {
                \Log::info('📎 Uploading '.count($files).' new file(s) for expense: '.$expenseId);

                foreach ($files as $file) {
                    $path = $file->store('receipts', 'public');
                    \Log::info('File stored at: '.$path);

                    Receipt::create([
                        'receipt_path' => $path,
                        'receipt_name' => $file->getClientOriginalName(),
                        'receipt_desc' => $file->getClientMimeType(),
                        'expense_id' => $expense->expense_id,
                    ]);
                    \Log::info('✅ Receipt created: '.$file->getClientOriginalName());
                }
            }

            // Handle tags
            if (array_key_exists('tags', $updatedExpense)) {
                if (! empty($updatedExpense['tags'])) {
                    $tagIds = [];
                    if (is_array($updatedExpense['tags'])) {
                        foreach ($updatedExpense['tags'] as $tag) {
                            if (is_numeric($tag)) {
                                $tagIds[] = (int) $tag;
                            }
                        }
                    }
                    $expense->tags()->sync($tagIds);
                } else {
                    // If tags sent but empty → remove all tags
                    $expense->tags()->detach();
                }
            }

            $result = $expense->fresh(['tags', 'receipts']);
            \Log::info('=== UPDATE EXPENSE END ===');

            // Recalculate claim total amount
            if ($expense->claim_id) {
                $claim = Claim::findOrFail($expense->claim_id);
                $totalAmount = $claim->expenses()->sum('expense_amount');
                $claim->update(['total_amount' => $totalAmount]);
            }

            return $result;
        });

    }

    private function updateClaimStatus($claimId)
    {
        $claim = Claim::with('expenses')->findOrFail($claimId);

        if ($claim->expenses->isEmpty()) {
            $claim->update(['claim_status_id' => ClaimStatus::PENDING]); // Pending (Empty)
        } elseif ($claim->expenses->every(fn ($expense) => $expense->approval_status_id == ClaimStatus::APPROVED)) {
            $claim->update(['claim_status_id' => ClaimStatus::APPROVED]); // All approved
        } elseif ($claim->expenses->contains(fn ($e) => $e->approval_status_id == ClaimStatus::REJECTED)) {
            $claim->update(['claim_status_id' => ClaimStatus::REJECTED]); // Any rejected
        } else {
            $claim->update(['claim_status_id' => ClaimStatus::PENDING]); // Pending
        }
        $claim->user->notify(new ClaimUpdatedNotification($claim));
    }

    public function deleteExpense(int $expenseId)
    {
        DB::transaction(function () use ($expenseId) {
            $expense = Expense::findOrFail($expenseId);

            // Delete receipt files
            if ($expense->receipts()->exists()) {
                foreach ($expense->receipts as $receipt) {
                    if ($receipt->receipt_path) {
                        Storage::disk('public')->delete($receipt->receipt_path);
                    }
                    $receipt->delete();
                }
            }

            $claimId = $expense->claim_id;
            $expense->delete();

            $this->updateClaimStatus($claimId);
        });
    }
}
