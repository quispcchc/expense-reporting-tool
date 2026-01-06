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

            // Handle file separately
            $file = $updatedExpense['file'] ?? null;
            unset($updatedExpense['file']);

            // Update expense fields
            $expense->update($updatedExpense);


            // Handle file upload (replace old receipt if exists)
            if ($file) {
                // Optional: delete old receipt file
                if ($expense->receipt) {
                    Storage::disk('public')->delete($expense->receipt->receipt_path);
                    $expense->receipt()->delete();
                }

                $path = $file->store('receipts', 'public');

                Receipt::create([
                    'receipt_path' => $path,
                    'receipt_name' => $file->getClientOriginalName(),
                    'receipt_desc' => $file->getClientMimeType(),
                    'expense_id' => $expense->expense_id,
                ]);
            }

            // Handle tags
            if (array_key_exists('tags', $updatedExpense)) {
                if (!empty($updatedExpense['tags'])) {
                    $tagNames = array_map('trim', explode(',', $updatedExpense['tags']));
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

            return $expense->fresh(['tags', 'receipt']);
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
