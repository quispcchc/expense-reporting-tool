<?php

namespace Tests\Feature;

use App\Models\Claim;
use App\Models\Expense;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;
use App\Enums\ClaimStatus;
use App\Enums\ClaimType;
use App\Enums\RoleLevel;
use Tests\Traits\SeedsLookups;

class ClaimControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    // ==================== STORE ====================

    public function test_authenticated_user_can_create_claim()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser(RoleLevel::USER);
        $this->attachUserToTeam($user, 1);

        $response = $this->postJson('/api/claims', [
            'position_id' => 1,
            'claim_type_id' => ClaimType::REIMBURSEMENT,
            'department_id' => 1,
            'team_id' => 1,
            'total_amount' => 100.00,
            'expenses' => [[
                'transaction_date' => '2026-01-15',
                'account_number_id' => 1,
                'buyer_name' => 'John Doe',
                'vendor_name' => 'Vendor Inc',
                'expense_amount' => 100.00,
                'project_id' => 1,
                'cost_centre_id' => 1,
            ]],
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('claims', ['user_id' => $user->user_id, 'claim_status_id' => ClaimStatus::PENDING]);
    }

    public function test_create_claim_with_multiple_expenses()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser(RoleLevel::USER);
        $this->attachUserToTeam($user, 1);

        $response = $this->postJson('/api/claims', [
            'position_id' => 1,
            'claim_type_id' => ClaimType::REIMBURSEMENT,
            'department_id' => 1,
            'team_id' => 1,
            'total_amount' => 200.00,
            'expenses' => [
                [
                    'transaction_date' => '2026-01-15',
                    'account_number_id' => 1,
                    'buyer_name' => 'John Doe',
                    'vendor_name' => 'Vendor A',
                    'expense_amount' => 100.00,
                    'project_id' => 1,
                    'cost_centre_id' => 1,
                ],
                [
                    'transaction_date' => '2026-01-16',
                    'account_number_id' => 1,
                    'buyer_name' => 'John Doe',
                    'vendor_name' => 'Vendor B',
                    'expense_amount' => 100.00,
                    'project_id' => 1,
                    'cost_centre_id' => 1,
                ],
            ],
        ]);

        $response->assertStatus(201);
        $claimId = $response->json('data.claim_id');
        $this->assertEquals(2, Expense::where('claim_id', $claimId)->count());
    }

    public function test_create_claim_with_mileage()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser(RoleLevel::USER);
        $this->attachUserToTeam($user, 1);

        $response = $this->postJson('/api/claims', [
            'position_id' => 1,
            'claim_type_id' => ClaimType::REIMBURSEMENT,
            'department_id' => 1,
            'team_id' => 1,
            'total_amount' => 25.50,
            'expenses' => [[
                'transaction_date' => '2026-01-15',
                'account_number_id' => 1,
                'buyer_name' => 'John Doe',
                'vendor_name' => 'Mileage',
                'expense_amount' => 25.50,
                'project_id' => 1,
                'cost_centre_id' => 1,
                'mileage' => [
                    'period_of_from' => '2026-01-01',
                    'period_of_to' => '2026-01-31',
                    'transactions' => [[
                        'transaction_date' => '2026-01-10',
                        'distance_km' => 50,
                        'meter_km' => 0,
                        'parking_amount' => 5.00,
                        'travel_from' => 'Ottawa',
                        'travel_to' => 'Toronto',
                    ]],
                ],
            ]],
        ]);

        $response->assertStatus(201);
        $claimId = $response->json('data.claim_id');
        $expense = Expense::where('claim_id', $claimId)->first();
        $this->assertNotNull($expense->mileage);
    }

    public function test_create_claim_with_notes()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser(RoleLevel::USER);
        $this->attachUserToTeam($user, 1);

        $response = $this->postJson('/api/claims', [
            'position_id' => 1,
            'claim_type_id' => ClaimType::REIMBURSEMENT,
            'department_id' => 1,
            'team_id' => 1,
            'total_amount' => 100.00,
            'claim_notes' => 'This is a test note',
            'expenses' => [[
                'transaction_date' => '2026-01-15',
                'account_number_id' => 1,
                'buyer_name' => 'John Doe',
                'vendor_name' => 'Vendor Inc',
                'expense_amount' => 100.00,
                'project_id' => 1,
                'cost_centre_id' => 1,
            ]],
        ]);

        $response->assertStatus(201);
        $claimId = $response->json('data.claim_id');
        $this->assertDatabaseHas('claim_notes', ['claim_id' => $claimId]);
    }

    public function test_create_claim_validation_requires_position_id()
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER);

        $response = $this->postJson('/api/claims', [
            'claim_type_id' => ClaimType::REIMBURSEMENT,
            'department_id' => 1,
            'team_id' => 1,
            'total_amount' => 100.00,
        ]);

        $response->assertStatus(422);
    }

    public function test_create_claim_validation_requires_total_amount_min_2()
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER);

        $response = $this->postJson('/api/claims', [
            'position_id' => 1,
            'claim_type_id' => ClaimType::REIMBURSEMENT,
            'department_id' => 1,
            'team_id' => 1,
            'total_amount' => 1,
        ]);

        $response->assertStatus(422);
    }

    public function test_create_claim_requires_authentication()
    {
        $response = $this->postJson('/api/claims', [
            'position_id' => 1,
            'claim_type_id' => ClaimType::REIMBURSEMENT,
            'department_id' => 1,
            'team_id' => 1,
            'total_amount' => 100.00,
        ]);

        $response->assertStatus(401);
    }

    // ==================== SHOW ====================

    public function test_authenticated_user_can_view_claim()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();
        $claim = $this->createClaimWithExpenses($user);

        $response = $this->getJson("/api/claims/{$claim->claim_id}");

        $response->assertStatus(200);
    }

    // ==================== INDEX ====================

    public function test_super_admin_sees_all_claims()
    {
        $this->seedLookups();
        $superAdmin = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);
        $otherUser = $this->createUser(['role_id' => RoleLevel::USER]);

        $this->createClaimForUser($superAdmin);
        $this->createClaimForUser($otherUser);

        $response = $this->getJson('/api/claims');

        $response->assertStatus(200);
        $claims = $response->json('data');
        $this->assertCount(2, $claims);
    }

    public function test_department_manager_sees_only_department_claims_excluding_own()
    {
        $this->seedLookups();
        $manager = $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);
        $sameDepUser = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 1]);
        $otherDepUser = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 2]);

        $this->createClaimForUser($manager, ['department_id' => 1]);
        $this->createClaimForUser($sameDepUser, ['department_id' => 1]);
        $this->createClaimForUser($otherDepUser, ['department_id' => 2]);

        $response = $this->getJson('/api/claims');

        $response->assertStatus(200);
        $claims = $response->json('data');
        // Should see only sameDepUser's claim (same dept, excluding own)
        $this->assertCount(1, $claims);
    }

    public function test_regular_user_sees_only_own_claims()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser(RoleLevel::USER);
        $otherUser = $this->createUser(['role_id' => RoleLevel::USER]);

        $this->createClaimForUser($user);
        $this->createClaimForUser($otherUser);

        $response = $this->getJson('/api/claims');

        $response->assertStatus(200);
        $claims = $response->json('data');
        $this->assertCount(1, $claims);
    }

    // ==================== GET CLAIMS BY USER ====================

    public function test_get_claims_by_user_returns_only_own_claims()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser(RoleLevel::USER);
        $otherUser = $this->createUser(['role_id' => RoleLevel::USER]);

        $this->createClaimForUser($user);
        $this->createClaimForUser($user);
        $this->createClaimForUser($otherUser);

        $response = $this->getJson('/api/my-claims');

        $response->assertStatus(200);
        $claims = $response->json('data');
        $this->assertCount(2, $claims);
    }

    public function test_get_claims_by_user_requires_authentication()
    {
        $response = $this->getJson('/api/my-claims');

        $response->assertStatus(401);
    }

    // ==================== UPDATE ====================

    public function test_update_claim()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();
        $claim = $this->createClaimForUser($user);

        $response = $this->putJson("/api/claims/{$claim->claim_id}", [
            'claim_type_id' => ClaimType::REIMBURSEMENT,
            'team_id' => 1,
        ]);

        $response->assertStatus(200);
    }

    // ==================== BULK APPROVE ====================

    public function test_super_admin_can_bulk_approve_claims()
    {
        $this->seedLookups();
        Notification::fake();
        $superAdmin = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);
        $regularUser = $this->createUser(['role_id' => RoleLevel::USER]);
        $claim = $this->createClaimWithExpenses($regularUser);

        $response = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim->claim_id],
        ]);

        $response->assertStatus(200);
        $claim->refresh();
        $this->assertEquals(ClaimStatus::APPROVED, $claim->claim_status_id);
    }

    public function test_department_manager_can_approve_claims_in_own_department()
    {
        $this->seedLookups();
        Notification::fake();
        $manager = $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);
        $regularUser = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 1]);
        $claim = $this->createClaimWithExpenses($regularUser, 1, ['department_id' => 1]);

        $response = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim->claim_id],
        ]);

        $response->assertStatus(200);
        $claim->refresh();
        $this->assertEquals(ClaimStatus::APPROVED, $claim->claim_status_id);
    }

    public function test_department_manager_cannot_approve_claims_in_other_department()
    {
        $this->seedLookups();
        $manager = $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);
        $otherDepUser = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 2]);
        $claim = $this->createClaimWithExpenses($otherDepUser, 1, ['department_id' => 2, 'team_id' => 2]);

        $response = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim->claim_id],
        ]);

        $response->assertStatus(403);
    }

    public function test_team_lead_can_approve_regular_user_claim_in_own_team()
    {
        $this->seedLookups();
        Notification::fake();
        $teamLead = $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]);
        $this->attachUserToTeam($teamLead, 1);
        $regularUser = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 1]);
        $this->attachUserToTeam($regularUser, 1);
        $claim = $this->createClaimWithExpenses($regularUser);

        $response = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim->claim_id],
        ]);

        $response->assertStatus(200);
    }

    public function test_team_lead_cannot_approve_another_team_lead_claim()
    {
        $this->seedLookups();
        $teamLead = $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]);
        $this->attachUserToTeam($teamLead, 1);
        $otherTeamLead = $this->createUser(['role_id' => RoleLevel::TEAM_LEAD, 'department_id' => 1]);
        $this->attachUserToTeam($otherTeamLead, 1);
        $claim = $this->createClaimWithExpenses($otherTeamLead);

        $response = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim->claim_id],
        ]);

        $response->assertStatus(403);
    }

    public function test_team_lead_cannot_approve_claims_in_other_team()
    {
        $this->seedLookups();
        $teamLead = $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]);
        $this->attachUserToTeam($teamLead, 1);
        $regularUser = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 2]);
        $this->attachUserToTeam($regularUser, 2);
        $claim = $this->createClaimWithExpenses($regularUser, 1, ['department_id' => 2, 'team_id' => 2]);

        $response = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim->claim_id],
        ]);

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_bulk_approve()
    {
        $this->seedLookups();
        $regularUser = $this->createAuthenticatedUser(RoleLevel::USER);
        $otherUser = $this->createUser(['role_id' => RoleLevel::USER]);
        $claim = $this->createClaimWithExpenses($otherUser);

        $response = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim->claim_id],
        ]);

        $response->assertStatus(403);
    }

    public function test_non_super_admin_cannot_self_approve()
    {
        $this->seedLookups();
        $manager = $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);
        $claim = $this->createClaimWithExpenses($manager, 1, ['department_id' => 1]);

        $response = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim->claim_id],
        ]);

        $response->assertStatus(403);
    }

    public function test_super_admin_can_self_approve()
    {
        $this->seedLookups();
        Notification::fake();
        $superAdmin = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);
        $claim = $this->createClaimWithExpenses($superAdmin);

        $response = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim->claim_id],
        ]);

        $response->assertStatus(200);
        $claim->refresh();
        $this->assertEquals(ClaimStatus::APPROVED, $claim->claim_status_id);
    }

    // ==================== BULK REJECT ====================

    public function test_super_admin_can_bulk_reject_claims()
    {
        $this->seedLookups();
        Notification::fake();
        $superAdmin = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);
        $regularUser = $this->createUser(['role_id' => RoleLevel::USER]);
        $claim = $this->createClaimWithExpenses($regularUser);

        $response = $this->postJson('/api/claims/bulk-reject', [
            'claimIds' => [$claim->claim_id],
        ]);

        $response->assertStatus(200);
        $claim->refresh();
        $this->assertEquals(ClaimStatus::REJECTED, $claim->claim_status_id);
    }

    public function test_department_manager_cannot_reject_claims_in_other_department()
    {
        $this->seedLookups();
        $manager = $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);
        $otherDepUser = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 2]);
        $claim = $this->createClaimWithExpenses($otherDepUser, 1, ['department_id' => 2, 'team_id' => 2]);

        $response = $this->postJson('/api/claims/bulk-reject', [
            'claimIds' => [$claim->claim_id],
        ]);

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_bulk_reject()
    {
        $this->seedLookups();
        $regularUser = $this->createAuthenticatedUser(RoleLevel::USER);
        $otherUser = $this->createUser(['role_id' => RoleLevel::USER]);
        $claim = $this->createClaimWithExpenses($otherUser);

        $response = $this->postJson('/api/claims/bulk-reject', [
            'claimIds' => [$claim->claim_id],
        ]);

        $response->assertStatus(403);
    }

    public function test_non_super_admin_cannot_self_reject()
    {
        $this->seedLookups();
        $manager = $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);
        $claim = $this->createClaimWithExpenses($manager, 1, ['department_id' => 1]);

        $response = $this->postJson('/api/claims/bulk-reject', [
            'claimIds' => [$claim->claim_id],
        ]);

        $response->assertStatus(403);
    }

    public function test_bulk_approve_requires_authentication()
    {
        $response = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [1],
        ]);

        $response->assertStatus(401);
    }

    public function test_index_requires_authentication()
    {
        $response = $this->getJson('/api/claims');

        $response->assertStatus(401);
    }
}
