<?php

namespace Tests\Integration;

use App\Enums\ClaimStatus;
use App\Enums\ClaimType;
use App\Enums\RoleLevel;
use App\Models\Claim;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class AuthorizationFlowTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
    }

    // ─── Regular User Cannot Approve Claims ─────────────────────────────

    public function test_regular_user_cannot_approve_claims()
    {
        $this->seedLookups();

        $submitter = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 1]);
        $regularUser = $this->createAuthenticatedUser(RoleLevel::USER);

        $claim = $this->createClaimWithExpenses($submitter, 1);

        $response = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim->claim_id],
        ]);
        $response->assertStatus(403);

        // Claim should still be pending
        $this->assertEquals(ClaimStatus::PENDING, Claim::find($claim->claim_id)->claim_status_id);
    }

    // ─── Regular User Cannot Reject Claims ──────────────────────────────

    public function test_regular_user_cannot_reject_claims()
    {
        $this->seedLookups();

        $submitter = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 1]);
        $regularUser = $this->createAuthenticatedUser(RoleLevel::USER);

        $claim = $this->createClaimWithExpenses($submitter, 1);

        $response = $this->postJson('/api/claims/bulk-reject', [
            'claimIds' => [$claim->claim_id],
        ]);
        $response->assertStatus(403);

        $this->assertEquals(ClaimStatus::PENDING, Claim::find($claim->claim_id)->claim_status_id);
    }

    // ─── Team Lead Can Only Approve Claims in Own Team ──────────────────

    public function test_team_lead_can_approve_own_team_claims()
    {
        $this->seedLookups();

        // User in team 1
        $submitter = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 1]);
        $this->attachUserToTeam($submitter, 1);

        // Team lead for team 1
        $teamLead = $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]);
        $this->attachUserToTeam($teamLead, 1);

        $claim = $this->createClaimWithExpenses($submitter, 1, ['team_id' => 1]);

        $response = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim->claim_id],
        ]);
        $response->assertStatus(200);

        $this->assertEquals(ClaimStatus::APPROVED, Claim::find($claim->claim_id)->claim_status_id);
    }

    public function test_team_lead_cannot_approve_other_team_claims()
    {
        $this->seedLookups();

        // User in team 2 (different department)
        $submitter = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 2]);
        $this->attachUserToTeam($submitter, 2);

        // Team lead for team 1 only
        $teamLead = $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]);
        $this->attachUserToTeam($teamLead, 1);

        $claim = $this->createClaimWithExpenses($submitter, 1, ['team_id' => 2, 'department_id' => 2]);

        $response = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim->claim_id],
        ]);
        $response->assertStatus(403);

        $this->assertEquals(ClaimStatus::PENDING, Claim::find($claim->claim_id)->claim_status_id);
    }

    // ─── Department Manager Scope ───────────────────────────────────────

    public function test_department_manager_can_approve_own_department_claims()
    {
        $this->seedLookups();

        $submitter = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 1]);
        $manager = $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);

        $claim = $this->createClaimWithExpenses($submitter, 1, ['department_id' => 1]);

        $response = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim->claim_id],
        ]);
        $response->assertStatus(200);

        $this->assertEquals(ClaimStatus::APPROVED, Claim::find($claim->claim_id)->claim_status_id);
    }

    public function test_department_manager_cannot_approve_other_department_claims()
    {
        $this->seedLookups();

        $submitter = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 2]);
        $manager = $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);

        $claim = $this->createClaimWithExpenses($submitter, 1, ['department_id' => 2]);

        $response = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim->claim_id],
        ]);
        $response->assertStatus(403);
    }

    // ─── Self-Approval Rules ────────────────────────────────────────────

    public function test_team_lead_cannot_self_approve_own_claim()
    {
        $this->seedLookups();

        $teamLead = $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]);
        $this->attachUserToTeam($teamLead, 1);

        $claim = $this->createClaimWithExpenses($teamLead, 1, ['team_id' => 1]);

        $response = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim->claim_id],
        ]);
        $response->assertStatus(403);
    }

    public function test_department_manager_cannot_self_approve_reimbursement()
    {
        $this->seedLookups();

        $manager = $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, [
            'department_id' => 1,
            'can_self_approve' => false,
        ]);

        $claim = $this->createClaimWithExpenses($manager, 1, [
            'department_id' => 1,
            'claim_type_id' => ClaimType::REIMBURSEMENT,
        ]);

        $response = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim->claim_id],
        ]);
        $response->assertStatus(403);
    }

    public function test_super_admin_can_self_approve()
    {
        $this->seedLookups();

        $superAdmin = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $claim = $this->createClaimWithExpenses($superAdmin, 1);

        $response = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim->claim_id],
        ]);
        $response->assertStatus(200);

        $this->assertEquals(ClaimStatus::APPROVED, Claim::find($claim->claim_id)->claim_status_id);
    }

    // ─── Team Lead Cannot Approve Another Team Lead's Claim ─────────────

    public function test_team_lead_cannot_approve_another_team_lead_claim()
    {
        $this->seedLookups();

        // Another team lead in same team
        $otherLead = $this->createUser([
            'role_id' => RoleLevel::TEAM_LEAD,
            'department_id' => 1,
        ]);
        $this->attachUserToTeam($otherLead, 1);

        // Current team lead
        $teamLead = $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]);
        $this->attachUserToTeam($teamLead, 1);

        $claim = $this->createClaimWithExpenses($otherLead, 1, ['team_id' => 1]);

        $response = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim->claim_id],
        ]);
        // Should be blocked — team lead claims must escalate to department manager
        $response->assertStatus(403);
    }

    // ─── Super Admin Can Approve Any Claim ──────────────────────────────

    public function test_super_admin_can_approve_any_department_claim()
    {
        $this->seedLookups();

        $user1 = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 1]);
        $user2 = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 2]);

        $claim1 = $this->createClaimWithExpenses($user1, 1, ['department_id' => 1]);
        $claim2 = $this->createClaimWithExpenses($user2, 1, ['department_id' => 2]);

        $admin = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $response = $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim1->claim_id, $claim2->claim_id],
        ]);
        $response->assertStatus(200);

        $this->assertEquals(ClaimStatus::APPROVED, Claim::find($claim1->claim_id)->claim_status_id);
        $this->assertEquals(ClaimStatus::APPROVED, Claim::find($claim2->claim_id)->claim_status_id);
    }

    // ─── Unauthenticated Access Blocked ─────────────────────────────────

    public function test_unauthenticated_user_cannot_access_claims()
    {
        $this->getJson('/api/claims')->assertStatus(401);
        $this->getJson('/api/my-claims')->assertStatus(401);
        $this->postJson('/api/claims', [])->assertStatus(401);
        $this->postJson('/api/claims/bulk-approve', [])->assertStatus(401);
    }

    // ─── User Sees Only Own Claims via /claims Endpoint ─────────────────

    public function test_user_role_sees_only_own_claims_via_index()
    {
        $this->seedLookups();

        $user1 = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 1]);
        $user2 = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 1]);

        $this->createClaimWithExpenses($user1, 1);
        $this->createClaimWithExpenses($user2, 1);

        $this->actingAs($user1);
        $response = $this->getJson('/api/claims');
        $response->assertStatus(200);

        // User should only see their own claim
        $claims = $response->json('data');
        $this->assertCount(1, $claims);
        $this->assertEquals($user1->user_id, $claims[0]['user_id']);
    }

    // ─── Super Admin Sees All Claims ────────────────────────────────────

    public function test_super_admin_sees_all_claims()
    {
        $this->seedLookups();

        $user1 = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 1]);
        $user2 = $this->createUser(['role_id' => RoleLevel::USER, 'department_id' => 2]);
        $admin = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $this->createClaimWithExpenses($user1, 1);
        $this->createClaimWithExpenses($user2, 1);

        $response = $this->getJson('/api/claims');
        $response->assertStatus(200);

        // Super admin sees all claims
        $this->assertCount(2, $response->json('data'));
    }
}
