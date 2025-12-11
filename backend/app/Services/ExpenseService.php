<?php

namespace App\Services;

use App\Models\Claim;
use App\Models\Expense;
use App\Notifications\ClaimUpdatedNotification;
use Illuminate\Support\Facades\DB;

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
