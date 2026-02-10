<?php

namespace App\Services;

use App\Enums\ClaimStatus;
use App\Enums\RoleLevel;
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

        $query = Claim::with(['expenses.receipts', 'expenses', 'claimType', 'department', 'team', 'status']);

        if ($role_level === RoleLevel::DEPARTMENT_MANAGER) {
            // Department-level access
            $query->where('department_id', $user->department_id)
                ->where('user_id', '!=', $user->user_id);

        } elseif ($role_level === RoleLevel::TEAM_LEAD) {
            // Team-level access, exclude own claims and claims from other approvers
            // (approver claims should escalate to admin/department manager)
            $teamIds = $user->teams->pluck('team_id')->toArray();
            $query->whereIn('team_id', $teamIds)
                ->where('user_id', '!=', $user->user_id)
                ->whereHas('user.role', function ($q) {
                    $q->where('role_level', '>', RoleLevel::TEAM_LEAD);
                });
        } elseif ($role_level === RoleLevel::USER) {
            // User-level access
            $query->where('user_id', $user->user_id);
        }

        // else role_level 1 or super admin sees all claims

        $claims = $query->get();

        return $claims;
    }

    public function getClaimsByUserId(User $user)
    {
        return Claim::with(['expenses.receipts', 'expenses', 'claimType', 'department', 'team', 'status'])
            ->where('user_id', $user->user_id)->get();
    }

    public function getClaimById(int $claimId)
    {
        return Claim::with(['expenses.tags', 'expenses.receipts', 'claimType', 'status', 'position', 'user', 'department', 'team', 'claimNotes.user', 'claimApprovals.approvedByUser'])
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
                'claim_status_id' => ClaimStatus::PENDING,
            ]);

            // Add claim note
            if (! empty($data['claim_notes'])) {
                $this->addNote($claim, $user, $data['claim_notes']);
            }

            // Add expenses
            if (! empty($data['expenses'])) {
                $this->addExpenses($claim, $data['expenses']);
            }

            // Add mileage
            if (! empty($data['mileage'])) {
                $mileage = Mileage::create($data['mileage']);
                $claim->update(['mileage_id' => $mileage->mileage_id]);
            }

            return $claim->load(['expenses.receipts', 'expenses', 'claimType', 'department', 'team', 'status']);
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
            $expenseData['approval_status_id'] = ClaimStatus::PENDING;

            // Extract files array (can be single or multiple files)
            $files = $expenseData['file'] ?? [];
            unset($expenseData['file']);

            \Log::info('Adding expense', [
                'expense_index' => $index,
                'has_files' => ! empty($files),
                'file_count' => is_array($files) ? count($files) : (empty($files) ? 0 : 1),
            ]);

            $expense = Expense::create($expenseData);

            // Handle file uploads (support both single file and array of files)
            if (! empty($files)) {
                // Normalize to array if single file
                $fileArray = is_array($files) ? $files : [$files];

                foreach ($fileArray as $file) {
                    if ($file && $file instanceof \Illuminate\Http\UploadedFile) {
                        $path = $file->store('receipts', 'public');
                        Receipt::create([
                            'receipt_path' => $path,
                            'receipt_name' => $file->getClientOriginalName(),
                            'receipt_desc' => $file->getClientMimeType(),
                            'expense_id' => $expense->expense_id,
                        ]);
                        \Log::info('Receipt created', ['path' => $path]);
                    }
                }
            }

            // Handle tags: expect $expenseData['tags'] to be an array of tag IDs
            if (! empty($expenseData['tags']) && is_array($expenseData['tags'])) {
                $expense->tags()->sync($expenseData['tags']);
            }
        }
    }

    public function updateClaim(array $data, $claimId)
    {
        $claim = Claim::find($claimId);

        if (! $claim) {
            return response()->json(['message' => 'Claim not found'], 404);
        }

        // Update the claim
        $claim->claim_type_id = $data['claim_type_id'];
        $claim->team_id = $data['team_id'];
        $claim->save();

        return response()->json([
            'message' => 'Claim updated successfully',
            'claim' => $claim,
        ]);

    }

    /**
     * Approve or reject selected claims
     */
    public function bulkApproveClaim(array $claimIds, User $approver): void
    {
        foreach ($claimIds as $claimId) {
            $this->updateClaimStatus($claimId, ClaimStatus::APPROVED, $approver);
        }
    }

    public function bulkRejectClaim(array $claimIds, User $approver): void
    {
        foreach ($claimIds as $claimId) {
            $this->updateClaimStatus($claimId, ClaimStatus::REJECTED, $approver);
        }
    }

    /**
     * Shared logic for approving/rejecting with error handling
     */
    private function updateClaimStatus(int $claimId, int $newStatusId, User $approver = null)
    {
        DB::beginTransaction();

        try {
            $claim = Claim::with('expenses')->find($claimId);

            if (! $claim) {
                throw new Exception(trans('messages.claim_not_found'), 404);
            }

            // Prevent double-approving or double-rejecting
            if ($claim->claim_status_id == $newStatusId) {
                throw new Exception(trans('messages.claim_already_in_status'), 400);
            }

            // Prevent approving rejected or rejecting approved
            if ($claim->claim_status_id !== ClaimStatus::PENDING) {
                throw new Exception(trans('messages.only_pending_update'), 400);
            }

            // Update claim status
            $claim->update([
                'claim_status_id' => $newStatusId,
            ]);

            // Update all expenses
            foreach ($claim->expenses as $expense) {
                $expense->update([
                    'approval_status_id' => $newStatusId,
                ]);
            }

            // Record who approved/rejected
            if ($approver) {
                \App\Models\ClaimApproval::create([
                    'claim_id' => $claim->claim_id,
                    'approved_by' => $approver->user_id,
                    'approval_status_id' => $newStatusId,
                    'claim_approval_details' => $newStatusId === ClaimStatus::APPROVED ? 'Approved' : 'Rejected',
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
