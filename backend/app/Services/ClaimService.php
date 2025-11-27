<?php

namespace App\Services;

use App\Models\Claim;
use App\Models\ClaimNote;
use App\Models\Expense;
use App\Models\Mileage;
use App\Models\Receipt;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ClaimService
{
    public function createClaim(array $data, $user): Claim
    {
        return DB::transaction(function () use ($data, $user) {

            // Create claim
            $claim = Claim::create([
                'user_id' => $user->user_id,
                'position_id' => $data['position_id'],
                'claim_type_id' => $data['claim_type_id'],
                'department_id' => $data['department_id'],
                'team_id' => $data['team_id'],
                'total_amount' => $data['total_amount'],
                'claim_submitted' => now(),
                'claim_status_id' => 1,
            ]);

            // Add claim note
            if (!empty($data['claim_notes'])) {
                $this->addNote($claim, $user, $data['claim_notes']);
            }

            // Add expenses
            if (!empty($data['expenses'])) {
                $this->addExpenses($claim, $data['expenses']);
            }

            // Add mileage
            if (!empty($data['mileage'])) {
                $mileage = Mileage::create($data['mileage']);
                $claim->update(['mileage_id' => $mileage->mileage_id]);
            }

            return $claim->load(['expenses', 'claimType', 'department', 'team', 'status']);
        });
    }

    protected function addNote(Claim $claim, $user, string $noteText)
    {
        ClaimNote::create([
            'user_id' => $user->user_id,
            'claim_id' => $claim->claim_id,
            'claim_note_text' => $noteText,
        ]);
    }

    protected function addExpenses(Claim $claim, array $expenses)
    {
        foreach ($expenses as $index => $expenseData) {
            $expenseData['claim_id'] = $claim->claim_id;
            $expenseData['approval_status_id'] = 1;

            $file = $expenseData['file'] ?? null;
            unset($expenseData['file']);

            $expense = Expense::create($expenseData);

            // Handle file upload
            if ($file) {
                $path = $file->store('receipts', 'public');
                Receipt::create([
                    'receipt_path' => $path,
                    'receipt_name' => $file->getClientOriginalName(),
                    'receipt_desc' => $file->getClientMimeType(),
                    'expense_id'=>$expense->expense_id
                ]);
            }

            // Handle tags
            if (!empty($expenseData['tags'])) {
                $tagNames = array_map('trim', explode(',', $expenseData['tags']));
                $tagIds = [];
                foreach ($tagNames as $name) {
                    $tag = Tag::firstOrCreate(['tag_name' => $name]);
                    $tagIds[] = $tag->tag_id;
                }
                $expense->tags()->sync($tagIds);

            }

        }
    }


}
