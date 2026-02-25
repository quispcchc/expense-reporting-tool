<?php

namespace App\Services;

use App\Enums\ClaimStatus;
use App\Enums\RoleLevel;
use App\Models\AppSetting;
use App\Models\Claim;
use App\Models\ClaimNote;
use App\Models\Expense;
use App\Models\Mileage;
use App\Models\MileageReceipt;
use App\Models\MileageTransaction;
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

        $query = Claim::with(['expenses.receipts', 'expenses.mileage.transactions.receipts', 'claimType', 'department', 'team', 'status']);

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

    /**
     * Get claims with full relationships for CSV export, applying optional filters.
     */
    public function getFilteredClaimsForExport(array $filters)
    {
        $query = Claim::with([
            'claimType',
            'status',
            'user',
            'department',
            'team',
            'position',
            'expenses.tags',
            'expenses.accountNumber',
            'expenses.costCentre',
            'expenses.approvalStatus',
            'expenses.project',
            'expenses.mileage.transactions',
            'notes.user',
        ]);

        $query->when($filters['date_from'] ?? null, fn ($q, $v) => $q->where('claim_submitted', '>=', $v))
              ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->where('claim_submitted', '<=', $v . ' 23:59:59'))
              ->when($filters['claim_type_id'] ?? null, fn ($q, $v) => $q->where('claim_type_id', $v))
              ->when($filters['claim_status_id'] ?? null, fn ($q, $v) => $q->where('claim_status_id', $v))
              ->when($filters['department_id'] ?? null, fn ($q, $v) => $q->where('department_id', $v))
              ->when($filters['team_id'] ?? null, fn ($q, $v) => $q->where('team_id', $v))
              ->when($filters['amount_min'] ?? null, fn ($q, $v) => $q->where('total_amount', '>=', $v))
              ->when($filters['amount_max'] ?? null, fn ($q, $v) => $q->where('total_amount', '<=', $v))
              ->when($filters['submitter'] ?? null, function ($q, $v) {
                  $q->whereHas('user', function ($uq) use ($v) {
                      $uq->where('first_name', 'like', "%{$v}%")
                          ->orWhere('last_name', 'like', "%{$v}%");
                  });
              })
              ->when($filters['project_id'] ?? null, function ($q, $v) {
                  $q->whereHas('expenses', fn ($eq) => $eq->where('project_id', $v));
              })
              ->when($filters['cost_centre_id'] ?? null, function ($q, $v) {
                  $q->whereHas('expenses', fn ($eq) => $eq->where('cost_centre_id', $v));
              })
              ->when($filters['tag_ids'] ?? null, function ($q, $v) {
                  $tagIds = is_array($v) ? $v : explode(',', $v);
                  $q->whereHas('expenses.tags', fn ($tq) => $tq->whereIn('tags.tag_id', $tagIds));
              });

        return $query->orderBy('claim_submitted', 'desc')->get();
    }

    public function getClaimsByUserId(User $user)
    {
        return Claim::with(['expenses.receipts', 'expenses.mileage.transactions.receipts', 'claimType', 'department', 'team', 'status'])
            ->where('user_id', $user->user_id)->get();
    }

    public function getClaimById(int $claimId)
    {
        return Claim::with(['expenses.tags', 'expenses.receipts', 'expenses.mileage.transactions.receipts', 'claimType', 'status', 'position', 'user', 'department', 'team', 'claimNotes.user', 'claimApprovals.approvedByUser'])
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

            // Add expenses (mileage is handled per-expense inside addExpenses)
            if (! empty($data['expenses'])) {
                $this->addExpenses($claim, $data['expenses']);
            }

            return $claim->load(['expenses.receipts', 'expenses.mileage.transactions.receipts', 'claimType', 'department', 'team', 'status']);
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

            // Extract files and mileage before creating the expense record
            $files = $expenseData['file'] ?? [];
            $mileageData = $expenseData['mileage'] ?? null;
            unset($expenseData['file'], $expenseData['mileage']);

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

            // Handle mileage bound to this expense
            if (! empty($mileageData)) {
                $this->addMileage($expense, $mileageData);
            }
        }
    }

    protected function addMileage(Expense $expense, array $mileageData)
    {
        // Create mileage header linked to the expense that represents this mileage cost
        $mileage = Mileage::create([
            'expense_id' => $expense->expense_id,
            'period_of_from' => $mileageData['period_of_from'],
            'period_of_to' => $mileageData['period_of_to'],
        ]);

        // Get current mileage rate
        $rate = (float) AppSetting::getValue('mileage_rate', 0.5);

        // Create transactions
        if (! empty($mileageData['transactions'])) {
            foreach ($mileageData['transactions'] as $index => $txData) {
                $totalAmount = MileageTransaction::calculateTotal(
                    (float) $txData['distance_km'],
                    $rate,
                    (float) ($txData['parking_amount'] ?? 0),
                    (float) ($txData['meter_km'] ?? 0)
                );

                $transaction = MileageTransaction::create([
                    'mileage_id' => $mileage->mileage_id,
                    'transaction_date' => $txData['transaction_date'],
                    'distance_km' => $txData['distance_km'],
                    'meter_km' => $txData['meter_km'] ?? null,
                    'parking_amount' => $txData['parking_amount'] ?? null,
                    'mileage_rate' => $rate,
                    'total_amount' => $totalAmount,
                    'buyer' => $txData['buyer'] ?? null,
                    'travel_from' => $txData['travel_from'] ?? null,
                    'travel_to' => $txData['travel_to'] ?? null,
                ]);

                // Handle receipt file uploads
                $files = $txData['file'] ?? [];
                if (! empty($files)) {
                    $fileArray = is_array($files) ? $files : [$files];
                    foreach ($fileArray as $file) {
                        if ($file && $file instanceof \Illuminate\Http\UploadedFile) {
                            $path = $file->store('mileage_receipts', 'public');
                            MileageReceipt::create([
                                'transaction_id' => $transaction->transaction_id,
                                'file_name' => $file->getClientOriginalName(),
                                'file_type' => $file->getClientMimeType(),
                                'file_path' => $path,
                            ]);
                        }
                    }
                }
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
