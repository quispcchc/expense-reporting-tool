<?php

namespace Tests\Feature;

use App\Enums\ActiveStatus;
use App\Enums\RoleLevel;
use App\Models\CostCentre;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class CostCentreControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    // ==================== INDEX (View) ====================

    public function test_super_admin_can_list_all_cost_centres(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN); // super_admin

        // Add a cost centre in dept 2
        CostCentre::create([
            'cost_centre_code' => 2002,
            'description' => 'Centre 2',
            'department_id' => 2,
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response = $this->getJson('/api/cost-centres');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        // Super admin sees all cost centres
        $response->assertJsonCount(2, 'data');
    }

    public function test_admin_can_list_own_department_cost_centres(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]); // department_manager

        // Add a cost centre in dept 2 (should not be visible)
        CostCentre::create([
            'cost_centre_code' => 2002,
            'description' => 'Centre 2',
            'department_id' => 2,
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response = $this->getJson('/api/cost-centres');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        // Admin sees only dept 1 cost centres
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.department_id', 1);
    }

    public function test_approver_can_list_own_department_cost_centres(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]); // team_lead

        $response = $this->getJson('/api/cost-centres');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonCount(1, 'data');
    }

    public function test_regular_user_cannot_list_cost_centres(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER, ['department_id' => 1]); // user

        $response = $this->getJson('/api/cost-centres');

        $response->assertStatus(403);
    }

    // ==================== STORE (Create) ====================

    public function test_super_admin_can_create_cost_centre(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $response = $this->postJson('/api/cost-centres', [
            'department_id' => 1,
            'cost_centre_code' => 2002,
            'description' => 'New Centre',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);
        $this->assertDatabaseHas('cost_centres', ['cost_centre_code' => 2002]);
    }

    public function test_super_admin_can_create_cost_centre_in_any_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN, ['department_id' => 1]);

        $response = $this->postJson('/api/cost-centres', [
            'department_id' => 2,
            'cost_centre_code' => 3003,
            'description' => 'Other Dept Centre',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(201);
    }

    public function test_admin_can_create_cost_centre_in_own_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);

        $response = $this->postJson('/api/cost-centres', [
            'department_id' => 1,
            'cost_centre_code' => 3003,
            'description' => 'Dept Centre',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(201);
    }

    public function test_admin_cannot_create_cost_centre_in_other_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);

        $response = $this->postJson('/api/cost-centres', [
            'department_id' => 2,
            'cost_centre_code' => 4004,
            'description' => 'Other Dept Centre',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(403);
    }

    public function test_approver_cannot_create_cost_centre(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]);

        $response = $this->postJson('/api/cost-centres', [
            'department_id' => 1,
            'cost_centre_code' => 5005,
            'description' => 'Approver Centre',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_create_cost_centre(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER, ['department_id' => 1]);

        $response = $this->postJson('/api/cost-centres', [
            'department_id' => 1,
            'cost_centre_code' => 6006,
            'description' => 'User Centre',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(403);
    }

    public function test_create_cost_centre_unique_code(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        // cost_centre_code 1001 already exists from seedLookups
        $response = $this->postJson('/api/cost-centres', [
            'department_id' => 1,
            'cost_centre_code' => 1001,
            'description' => 'Duplicate Code',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(422);
    }

    // ==================== SHOW (View single) ====================

    public function test_super_admin_can_show_any_cost_centre(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $costCentre = CostCentre::first();

        $response = $this->getJson("/api/cost-centres/{$costCentre->cost_centre_id}");

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
    }

    // ==================== UPDATE ====================

    public function test_super_admin_can_update_any_cost_centre(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $costCentre = CostCentre::first();

        $response = $this->putJson("/api/cost-centres/{$costCentre->cost_centre_id}", [
            'department_id' => 1,
            'cost_centre_code' => $costCentre->cost_centre_code,
            'description' => 'Updated Centre',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $this->assertDatabaseHas('cost_centres', [
            'cost_centre_id' => $costCentre->cost_centre_id,
            'description' => 'Updated Centre',
        ]);
    }

    public function test_admin_can_update_own_department_cost_centre(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);

        $costCentre = CostCentre::where('department_id', 1)->first();

        $response = $this->putJson("/api/cost-centres/{$costCentre->cost_centre_id}", [
            'department_id' => 1,
            'cost_centre_code' => $costCentre->cost_centre_code,
            'description' => 'Admin Updated',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
    }

    public function test_admin_cannot_update_other_department_cost_centre(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);

        // Create a cost centre in dept 2
        $costCentre = CostCentre::create([
            'cost_centre_code' => 2002,
            'description' => 'Dept 2 Centre',
            'department_id' => 2,
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response = $this->putJson("/api/cost-centres/{$costCentre->cost_centre_id}", [
            'department_id' => 2,
            'cost_centre_code' => $costCentre->cost_centre_code,
            'description' => 'Hacked',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseHas('cost_centres', [
            'cost_centre_id' => $costCentre->cost_centre_id,
            'description' => 'Dept 2 Centre',
        ]);
    }

    public function test_approver_cannot_update_cost_centre(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]);

        $costCentre = CostCentre::first();

        $response = $this->putJson("/api/cost-centres/{$costCentre->cost_centre_id}", [
            'department_id' => 1,
            'cost_centre_code' => $costCentre->cost_centre_code,
            'description' => 'Hacked',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_update_cost_centre(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER, ['department_id' => 1]);

        $costCentre = CostCentre::first();

        $response = $this->putJson("/api/cost-centres/{$costCentre->cost_centre_id}", [
            'department_id' => 1,
            'cost_centre_code' => $costCentre->cost_centre_code,
            'description' => 'Hacked',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(403);
    }

    // ==================== DESTROY (Delete) ====================

    public function test_super_admin_can_delete_cost_centre(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $costCentre = CostCentre::first();

        $response = $this->deleteJson("/api/cost-centres/{$costCentre->cost_centre_id}");

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $this->assertDatabaseMissing('cost_centres', ['cost_centre_id' => $costCentre->cost_centre_id]);
    }

    public function test_admin_can_delete_own_department_cost_centre(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);

        $costCentre = CostCentre::where('department_id', 1)->first();

        $response = $this->deleteJson("/api/cost-centres/{$costCentre->cost_centre_id}");

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $this->assertDatabaseMissing('cost_centres', ['cost_centre_id' => $costCentre->cost_centre_id]);
    }

    public function test_admin_cannot_delete_other_department_cost_centre(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);

        $costCentre = CostCentre::create([
            'cost_centre_code' => 2002,
            'description' => 'Dept 2 Centre',
            'department_id' => 2,
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response = $this->deleteJson("/api/cost-centres/{$costCentre->cost_centre_id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('cost_centres', ['cost_centre_id' => $costCentre->cost_centre_id]);
    }

    public function test_approver_cannot_delete_cost_centre(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]);

        $costCentre = CostCentre::first();

        $response = $this->deleteJson("/api/cost-centres/{$costCentre->cost_centre_id}");

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_delete_cost_centre(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER, ['department_id' => 1]);

        $costCentre = CostCentre::first();

        $response = $this->deleteJson("/api/cost-centres/{$costCentre->cost_centre_id}");

        $response->assertStatus(403);
    }

    // ==================== AUTHENTICATION ====================

    public function test_cost_centres_require_authentication(): void
    {
        $response = $this->getJson('/api/cost-centres');
        $response->assertStatus(401);
    }

    public function test_create_cost_centre_requires_authentication(): void
    {
        $response = $this->postJson('/api/cost-centres', [
            'department_id' => 1,
            'cost_centre_code' => 9999,
            'description' => 'Test',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);
        $response->assertStatus(401);
    }

    public function test_update_cost_centre_requires_authentication(): void
    {
        $response = $this->putJson('/api/cost-centres/1', [
            'cost_centre_code' => 1001,
            'description' => 'Test',
        ]);
        $response->assertStatus(401);
    }

    public function test_delete_cost_centre_requires_authentication(): void
    {
        $response = $this->deleteJson('/api/cost-centres/1');
        $response->assertStatus(401);
    }
}
