<?php

namespace App\Services;

use App\Models\Claim;
use App\Models\ClaimNote;
use App\Models\Expense;
use App\Models\Mileage;
use App\Models\Receipt;
use App\Models\Tag;
use App\Models\User;
use App\Notifications\ClaimUpdatedNotification;
use Exception;
use Illuminate\Support\Facades\DB;

class ClaimService
{
    public function getAllClaims(User $user)
    {
        $role_level = $user->role->role_level;

        $query = Claim::with(['expenses', 'claimType', 'department', 'team', 'status']);

        if ($role_level === 2) {
            // Department-level access
            $query->where('department_id', $user->department_id)
                ->where('user_id', '!=', $user->user_id);

        } elseif ($role_level === 3) {
            // Team-level access or own claims
            $query->where('team_id', $user->team_id)
                ->where('user_id', '!=', $user->user_id);

        } elseif ($role_level === 4) {
            // User-level access
            $query->where('user_id', $user->user_id);
        }

        // else role_level 1 or super admin sees all claims

        $claims = $query->get();

        return $claims;
    }

    public function getClaimsByUserId(User $user)
    {
        return Claim::with(['expenses', 'claimType', 'department', 'team', 'status'])
            ->where('user_id', $user->user_id)->get();
    }


    public function getClaimById(int $claimId)
    {
        return Claim::with(['expenses.tags','expenses.receipts' ,'claimType', 'status', 'position', 'user', 'department', 'team', 'claimNotes.user'])
            ->where('claim_id', $claimId)
            ->first();
    }


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

            return $claim->load(['expenses', 'claimType', 'department', 'team', 'status','expenses.receipts']);
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
                foreach ($file as $f) {
                    if ($f) {
                        $path = $f->store('receipts', 'public');
                        Receipt::create([
                            'receipt_path' => $path,
                            'receipt_name' => $f->getClientOriginalName(),
                            'receipt_desc' => $f->getClientMimeType(),
                            'expense_id' => $expense->expense_id
                        ]);
                    }
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


    public function updateClaim(array $data, $claimId)
    {
        $claim = Claim::find($claimId);

        if (!$claim) {
            return response()->json(['message' => 'Claim not found'], 404);
        }


        // Update the claim
        $claim->claim_type_id = $data['claim_type_id'];
        $claim->team_id = $data['team_id'];
        $claim->save();

        return response()->json([
            'message' => 'Claim updated successfully',
            'claim' => $claim
        ]);

    }

    /**
     * Approve or reject selected claims
     */
    public function bulkApproveClaim(array $claimIds): void
    {
        foreach ($claimIds as $claimId) {
            $this->updateClaimStatus($claimId, 2); // 2 for approved
        }
    }

    public function bulkRejectClaim(array $claimIds): void
    {
        foreach ($claimIds as $claimId) {
            $this->updateClaimStatus($claimId, 3); // 3 for rejected
        }
    }

    /**
     * Shared logic for approving/rejecting with error handling
     */
    private function updateClaimStatus(int $claimId, int $newStatusId)
    {
        DB::beginTransaction();

        try {
            $claim = Claim::with('expenses')->find($claimId);

            if (!$claim) {
                throw new Exception("Claim not found.", 404);
            }

            // Prevent double-approving or double-rejecting
            if ($claim->claim_status_id == $newStatusId) {
                throw new Exception("Claim is already in this status.", 400);
            }

            // Prevent approving rejected or rejecting approved
            if ($claim->claim_status_id !== 1) {  // 1 = Pending
                throw new Exception("Only pending claims can be updated.", 400);
            }

            // Update claim status
            $claim->update([
                'claim_status_id' => $newStatusId
            ]);

            // Update all expenses
            foreach ($claim->expenses as $expense) {
                $expense->update([
                    'approval_status_id' => $newStatusId
                ]);
            }

            DB::commit();

            // Send email to the claim owner
            $claim->user->notify(new ClaimUpdatedNotification($claim));

            return $claim;

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }


}
