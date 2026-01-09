<?php

namespace App\Services;

use App\Models\Claim;
use App\Models\Expense;
use App\Models\Receipt;
use App\Models\Tag;
use App\Notifications\ClaimUpdatedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ExpenseService
{
    public function approveExpense(int $expenseId)
    {
        DB::transaction(function () use ($expenseId) {
            $expense = Expense::findOrFail($expenseId);

            $expense->update(['approval_status_id' => 2]);

            $this->updateClaimStatus($expense->claim_id);
        });
    }

    public function rejectExpense(int $expenseId)
    {
        DB::transaction(function () use ($expenseId) {
            $expense = Expense::findOrFail($expenseId);

            $expense->update(['approval_status_id' => 3]); // 3 = Rejected

            $this->updateClaimStatus($expense->claim_id);
        });
    }

    public function updateExpense(array $updatedExpense, int $expenseId)
    {
        return DB::transaction(function () use ($expenseId, $updatedExpense) {
            $expense = Expense::findOrFail($expenseId);

            // Handle deleted receipts
            $deletedReceiptIds = [];
            if (!empty($updatedExpense['deleted_receipts'])) {
                $deletedReceiptIds = json_decode($updatedExpense['deleted_receipts'], true) ?? [];
                
                if (!empty($deletedReceiptIds)) {
                    $receiptsToDelete = Receipt::whereIn('receipt_id', $deletedReceiptIds)
                        ->where('expense_id', $expenseId)
                        ->get();
                    
                    foreach ($receiptsToDelete as $receipt) {
                        Storage::disk('public')->delete($receipt->receipt_path);
                        $receipt->delete();
                    }
                }
            }
            unset($updatedExpense['deleted_receipts']);

            // Handle file separately
            $file = $updatedExpense['file'] ?? null;
            unset($updatedExpense['file']);

            // Handle tags separately (not fillable on Expense model)
            $tags = $updatedExpense['tags'] ?? null;
            unset($updatedExpense['tags']);
        

            // Update expense fields (now only contains fillable fields)
            $updated = $expense->update($updatedExpense);
            

            // Handle file upload (add new receipts without deleting existing ones)
            if (!empty($file)) {
                foreach ($file as $f) {
                    $path = $f->store('receipts', 'public');

                    Receipt::create([
                        'receipt_path' => $path,
                        'receipt_name' => $f->getClientOriginalName(),
                        'receipt_desc' => $f->getClientMimeType(),
                        'expense_id' => $expense->expense_id,
                    ]);
                }
            }

            // Handle tags
            if ($tags !== null) {
                if (!empty($tags)) {
                    $tagNames = array_map('trim', explode(',', $tags));
                    $tagIds = [];

                    foreach ($tagNames as $name) {
                        $tag = Tag::firstOrCreate(['tag_name' => $name]);
                        $tagIds[] = $tag->tag_id;
                    }

                    $expense->tags()->sync($tagIds);
                } else {
                    // If tags sent but empty → remove all tags
                    $expense->tags()->detach();
                }
            }

            $final = $expense->fresh(['tags', 'receipts']);
            
            // Recalculate claim total amount
            if ($expense->claim_id) {
                $claim = Claim::findOrFail($expense->claim_id);
                $totalAmount = $claim->expenses()->sum('expense_amount');
                $claim->update(['total_amount' => $totalAmount]);
            }
            
            return $final;
        });
    }


    private function updateClaimStatus($claimId)
    {
        $claim = Claim::with('expenses')->findOrFail($claimId);

        if ($claim->expenses->every(fn($expense) => $expense->approval_status_id == 2)) {
            $claim->update(['claim_status_id' => 2]); // All approved

        } elseif ($claim->expenses->contains(fn($e) => $e->approval_status_id == 3)) {
            $claim->update(['claim_status_id' => 3]); // Any rejected

        } else {
            $claim->update(['claim_status_id' => 1]); // Pending
        }
        $claim->user->notify(new ClaimUpdatedNotification($claim));
    }
}
