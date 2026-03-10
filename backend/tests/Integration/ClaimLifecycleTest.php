<?php

namespace Tests\Integration;

use App\Enums\ClaimStatus;
use App\Enums\ClaimType;
use App\Enums\RoleLevel;
use App\Models\Claim;
use App\Models\Expense;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class ClaimLifecycleTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
    }

    // ─── Create Claim → View → Approve → Verify Status ─────────────────

    public function test_create_claim_with_expenses_then_approve()
    {
        $this->seedLookups();

        // Create a regular user who submits the claim
        $submitter = $this->createUser([
            'role_id' => RoleLevel::USER,
            'department_id' => 1,
        ]);
        $this->attachUserToTeam($submitter, 1);

        // Create an admin who will approve
        $admin = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        // Step 1: Create a claim with expenses
        $claimData = [
            'position_id' => 1,
            'claim_type_id' => ClaimType::REIMBURSEMENT,
            'department_id' => 1,
            'team_id' => 1,
            'total_amount' => 150.00,
            'claim_notes' => 'Office supplies purchase',
            'expenses' => [
                [
                    'transaction_date' => now()->toDateString(),
                    'account_number_id' => 1,
                    'buyer_name' => 'John Doe',
                    'vendor_name' => 'Staples',
                    'transaction_desc' => 'Paper and pens',
                    'expense_amount' => 75.00,
                    'project_id' => 1,
                    'cost_centre_id' => 1,
                ],
                [
                    'transaction_date' => now()->toDateString(),
                    'account_number_id' => 1,
                    'buyer_name' => 'John Doe',
                    'vendor_name' => 'Best Buy',
                    'transaction_desc' => 'USB cables',
                    'expense_amount' => 75.00,
                    'project_id' => 1,
                    'cost_centre_id' => 1,
                ],
            ],
        ];

        // Submit as the regular user
        $this->actingAs($submitter);
        $createResponse = $this->postJson('/api/claims', $claimData);
        $createResponse->assertStatus(201);
        $claimId = $createResponse->json('data.claim_id');
        $this->assertNotNull($claimId);

        // Step 2: View the claim — verify it has 2 expenses, status pending
        $this->actingAs($admin);
        $viewResponse = $this->getJson("/api/claims/{$claimId}");
        $viewResponse->assertStatus(200);
        $viewData = $viewResponse->json('data');
        $this->assertEquals(ClaimStatus::PENDING, $viewData['claim_status_id']);
        $this->assertCount(2, $viewData['expenses']);

        // Step 3: Approve the claim
        $approveResponse = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claimId],
        ]);
        $approveResponse->assertStatus(200);

        // Step 4: Verify claim and expenses are approved
        $claim = Claim::find($claimId);
        $this->assertEquals(ClaimStatus::APPROVED, $claim->claim_status_id);

        foreach ($claim->expenses as $expense) {
            $this->assertEquals(ClaimStatus::APPROVED, $expense->approval_status_id);
        }

        // Verify approval record was created
        $this->assertDatabaseHas('claim_approval', [
            'claim_id' => $claimId,
            'approved_by' => $admin->user_id,
            'approval_status_id' => ClaimStatus::APPROVED,
        ]);
    }

    // ─── Create Claim → Reject → Verify Status ─────────────────────────

    public function test_create_claim_then_reject()
    {
        $this->seedLookups();

        $submitter = $this->createUser([
            'role_id' => RoleLevel::USER,
            'department_id' => 1,
        ]);
        $admin = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        // Create claim via helper
        $claim = $this->createClaimWithExpenses($submitter, 1);
        $claimId = $claim->claim_id;

        // Reject
        $rejectResponse = $this->postJson('/api/claims/bulk-reject', [
            'claimIds' => [$claimId],
        ]);
        $rejectResponse->assertStatus(200);

        // Verify
        $claim->refresh();
        $this->assertEquals(ClaimStatus::REJECTED, $claim->claim_status_id);
        foreach ($claim->expenses as $expense) {
            $expense->refresh();
            $this->assertEquals(ClaimStatus::REJECTED, $expense->approval_status_id);
        }

        $this->assertDatabaseHas('claim_approval', [
            'claim_id' => $claimId,
            'approved_by' => $admin->user_id,
            'approval_status_id' => ClaimStatus::REJECTED,
        ]);
    }

    // ─── Bulk Approve Multiple Claims ───────────────────────────────────

    public function test_bulk_approve_multiple_claims()
    {
        $this->seedLookups();

        $user1 = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 1]);
        $user2 = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 1]);
        $admin = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $claim1 = $this->createClaimWithExpenses($user1, 2);
        $claim2 = $this->createClaimWithExpenses($user2, 1);

        $response = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim1->claim_id, $claim2->claim_id],
        ]);
        $response->assertStatus(200);

        $this->assertEquals(ClaimStatus::APPROVED, Claim::find($claim1->claim_id)->claim_status_id);
        $this->assertEquals(ClaimStatus::APPROVED, Claim::find($claim2->claim_id)->claim_status_id);
    }

    // ─── Cannot Double-Approve a Claim ──────────────────────────────────

    public function test_cannot_approve_already_approved_claim()
    {
        $this->seedLookups();

        $user = $this->createUser(['role_id' => RoleLevel::USER]);
        $admin = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $claim = $this->createClaimWithExpenses($user, 1);

        // First approval succeeds
        $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim->claim_id],
        ])->assertStatus(200);

        // Second approval should fail
        $response = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim->claim_id],
        ]);
        $response->assertStatus(500);
    }

    // ─── Create Claim with Mileage → View → Verify Structure ───────────

    public function test_create_claim_with_mileage_expenses()
    {
        $this->seedLookups();

        $submitter = $this->createUser([
            'role_id' => RoleLevel::USER,
            'department_id' => 1,
        ]);

        $claimData = [
            'position_id' => 1,
            'claim_type_id' => ClaimType::REIMBURSEMENT,
            'department_id' => 1,
            'team_id' => 1,
            'total_amount' => 50.00,
            'expenses' => [
                [
                    'transaction_date' => now()->toDateString(),
                    'account_number_id' => 1,
                    'buyer_name' => 'Jane Doe',
                    'vendor_name' => 'Mileage',
                    'transaction_desc' => 'Client visit travel',
                    'expense_amount' => 50.00,
                    'project_id' => 1,
                    'cost_centre_id' => 1,
                    'mileage' => [
                        'period_of_from' => now()->startOfMonth()->toDateString(),
                        'period_of_to' => now()->endOfMonth()->toDateString(),
                        'transactions' => [
                            [
                                'transaction_date' => now()->toDateString(),
                                'distance_km' => 100,
                                'meter_km' => 0,
                                'parking_amount' => 5.00,
                                'buyer' => 'Jane Doe',
                                'travel_from' => 'Ottawa',
                                'travel_to' => 'Toronto',
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $this->actingAs($submitter);
        $response = $this->postJson('/api/claims', $claimData);
        $response->assertStatus(201);
        $claimId = $response->json('data.claim_id');

        // Verify claim structure
        $admin = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);
        $viewResponse = $this->getJson("/api/claims/{$claimId}");
        $viewResponse->assertStatus(200);

        $data = $viewResponse->json('data');
        $this->assertCount(1, $data['expenses']);
        $this->assertNotNull($data['expenses'][0]['mileage']);
        $this->assertCount(1, $data['expenses'][0]['mileage']['transactions']);

        $tx = $data['expenses'][0]['mileage']['transactions'][0];
        $this->assertEquals('Ottawa', $tx['travel_from']);
        $this->assertEquals('Toronto', $tx['travel_to']);
        $this->assertEquals(100, $tx['distance_km']);
    }

    // ─── User Views Own Claims Only ─────────────────────────────────────

    public function test_user_can_only_view_own_claims()
    {
        $this->seedLookups();

        $user1 = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 1]);
        $user2 = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 1]);

        $this->createClaimWithExpenses($user1, 1);
        $this->createClaimWithExpenses($user1, 1);
        $this->createClaimWithExpenses($user2, 1);

        // User1 should see only their 2 claims via my-claims
        $this->actingAs($user1);
        $response = $this->getJson('/api/my-claims');
        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));

        // User2 should see only their 1 claim
        $this->actingAs($user2);
        $response2 = $this->getJson('/api/my-claims');
        $response2->assertStatus(200);
        $this->assertCount(1, $response2->json('data'));
    }

    // ─── Claim with Notes → View Notes ──────────────────────────────────

    public function test_claim_notes_are_persisted_and_returned()
    {
        $this->seedLookups();

        $submitter = $this->createUser([
            'role_id' => RoleLevel::USER,
            'department_id' => 1,
        ]);

        $claimData = [
            'position_id' => 1,
            'claim_type_id' => ClaimType::REIMBURSEMENT,
            'department_id' => 1,
            'team_id' => 1,
            'total_amount' => 100.00,
            'claim_notes' => 'Please prioritize this reimbursement',
            'expenses' => [
                [
                    'transaction_date' => now()->toDateString(),
                    'account_number_id' => 1,
                    'buyer_name' => 'Test User',
                    'vendor_name' => 'Vendor',
                    'expense_amount' => 100.00,
                    'project_id' => 1,
                    'cost_centre_id' => 1,
                ],
            ],
        ];

        $this->actingAs($submitter);
        $response = $this->postJson('/api/claims', $claimData);
        $response->assertStatus(201);
        $claimId = $response->json('data.claim_id');

        // View claim as admin and check notes
        $admin = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);
        $viewResponse = $this->getJson("/api/claims/{$claimId}");
        $viewResponse->assertStatus(200);

        $this->assertNotEmpty($viewResponse->json('data.claim_notes'));
        $this->assertEquals(
            'Please prioritize this reimbursement',
            $viewResponse->json('data.claim_notes.0.claim_note_text')
        );
    }

    // ─── CSV Export with Filters ────────────────────────────────────────

    public function test_csv_export_returns_filtered_data()
    {
        $this->seedLookups();

        $user = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 1]);
        $admin = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        // Create claims with different types
        $this->createClaimWithExpenses($user, 1, ['claim_type_id' => ClaimType::REIMBURSEMENT]);
        $this->createClaimWithExpenses($user, 1, ['claim_type_id' => ClaimType::PETTY_CASH]);

        // Export filtered to reimbursement only
        $response = $this->getJson('/api/claims/export-csv?claim_type_id=' . ClaimType::REIMBURSEMENT);
        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');

        $csv = $response->streamedContent();
        $lines = array_filter(explode("\n", $csv));
        // Header + 1 data row (only reimbursement claim)
        $this->assertCount(2, $lines);
    }

    // ─── Expense Approval Propagation ───────────────────────────────────

    public function test_individual_expense_approval()
    {
        $this->seedLookups();

        $user = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 1]);
        $admin = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $claim = $this->createClaimWithExpenses($user, 2);
        $expenseIds = $claim->expenses->pluck('expense_id')->toArray();

        // Approve first expense
        $response = $this->postJson("/api/expenses/{$expenseIds[0]}/approve");
        $response->assertStatus(200);

        $this->assertEquals(
            ClaimStatus::APPROVED,
            Expense::find($expenseIds[0])->approval_status_id
        );
        // Second expense still pending
        $this->assertEquals(
            ClaimStatus::PENDING,
            Expense::find($expenseIds[1])->approval_status_id
        );
    }

    // ─── Expense Rejection ──────────────────────────────────────────────

    public function test_individual_expense_rejection()
    {
        $this->seedLookups();

        $user = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 1]);
        $admin = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $claim = $this->createClaimWithExpenses($user, 1);
        $expenseId = $claim->expenses->first()->expense_id;

        $response = $this->postJson("/api/expenses/{$expenseId}/reject");
        $response->assertStatus(200);

        $this->assertEquals(
            ClaimStatus::REJECTED,
            Expense::find($expenseId)->approval_status_id
        );
    }
}
