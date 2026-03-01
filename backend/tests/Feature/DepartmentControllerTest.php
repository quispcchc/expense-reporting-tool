<?php

namespace Tests\Feature;

use App\Enums\ActiveStatus;
use App\Enums\RoleLevel;
use App\Models\Department;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class DepartmentControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    // ==================== INDEX (View) ====================

    public function test_super_admin_sees_all_departments(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN); // super_admin

        $response = $this->getJson('/api/departments');

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonCount(2, 'data');
    }

    public function test_admin_sees_all_departments(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]); // department_manager

        $response = $this->getJson('/api/departments');

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonCount(2, 'data');
    }

    public function test_approver_sees_only_own_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]); // team_lead

        $response = $this->getJson('/api/departments');

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.department_id', 1);
    }

    public function test_regular_user_sees_only_own_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER, ['department_id' => 1]); // user

        $response = $this->getJson('/api/departments');

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.department_id', 1);
    }

    // ==================== STORE (Create) ====================

    public function test_super_admin_can_create_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $response = $this->postJson('/api/departments', [
            'department_name' => 'Finance',
            'department_abbreviation' => 'FIN',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', true)
            ->assertJsonPath('data.department_name', 'Finance');
        $this->assertDatabaseHas('departments', ['department_abbreviation' => 'FIN']);
    }

    public function test_admin_cannot_create_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);

        $response = $this->postJson('/api/departments', [
            'department_name' => 'Finance',
            'department_abbreviation' => 'FIN',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(403);
    }

    public function test_approver_cannot_create_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]);

        $response = $this->postJson('/api/departments', [
            'department_name' => 'Finance',
            'department_abbreviation' => 'FIN',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_create_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER, ['department_id' => 1]);

        $response = $this->postJson('/api/departments', [
            'department_name' => 'Finance',
            'department_abbreviation' => 'FIN',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(403);
    }

    public function test_create_department_unique_abbreviation(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $response = $this->postJson('/api/departments', [
            'department_name' => 'Duplicate Eng',
            'department_abbreviation' => 'ENG', // already seeded
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(422);
    }

    // ==================== SHOW (View single) ====================

    public function test_super_admin_can_show_any_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $response = $this->getJson('/api/departments/1');

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonPath('data.department_id', 1)
            ->assertJsonPath('data.active_status.active_status_id', 1);
    }

    // ==================== UPDATE ====================

    public function test_super_admin_can_update_any_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $response = $this->putJson('/api/departments/1', [
            'department_name' => 'Engineering Updated',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonPath('data.department_name', 'Engineering Updated');
        $this->assertDatabaseHas('departments', [
            'department_id' => 1,
            'department_name' => 'Engineering Updated',
        ]);
    }

    public function test_admin_can_update_own_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);

        $response = $this->putJson('/api/departments/1', [
            'department_name' => 'My Dept Updated',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonPath('data.department_name', 'My Dept Updated');
    }

    public function test_admin_cannot_update_other_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);

        $response = $this->putJson('/api/departments/2', [
            'department_name' => 'Hacked Name',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseHas('departments', [
            'department_id' => 2,
            'department_name' => 'Marketing',
        ]);
    }

    public function test_approver_cannot_update_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]);

        $response = $this->putJson('/api/departments/1', [
            'department_name' => 'Hacked',
        ]);

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_update_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER, ['department_id' => 1]);

        $response = $this->putJson('/api/departments/1', [
            'department_name' => 'Hacked',
        ]);

        $response->assertStatus(403);
    }

    // ==================== DESTROY (Delete) ====================

    public function test_super_admin_can_delete_department_without_teams(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $dept = Department::create([
            'department_name' => 'Temp Dept',
            'department_abbreviation' => 'TMP',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response = $this->deleteJson("/api/departments/{$dept->department_id}");

        $response->assertStatus(200)
            ->assertJsonPath('status', true);
        $this->assertDatabaseMissing('departments', [
            'department_id' => $dept->department_id,
        ]);
    }

    public function test_super_admin_cannot_delete_department_with_teams(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        // Department 1 has team "Alpha" seeded
        $response = $this->deleteJson('/api/departments/1');

        $response->assertStatus(422)
            ->assertJsonPath('status', false);
    }

    public function test_admin_can_delete_own_department_without_teams(): void
    {
        $this->seedLookups();

        $dept = Department::create([
            'department_name' => 'Temp Dept',
            'department_abbreviation' => 'TMP',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => $dept->department_id]);

        $response = $this->deleteJson("/api/departments/{$dept->department_id}");

        $response->assertStatus(200)
            ->assertJsonPath('status', true);
        $this->assertDatabaseMissing('departments', [
            'department_id' => $dept->department_id,
        ]);
    }

    public function test_admin_cannot_delete_other_department(): void
    {
        $this->seedLookups();

        $dept = Department::create([
            'department_name' => 'Other Dept',
            'department_abbreviation' => 'OTH',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);

        $response = $this->deleteJson("/api/departments/{$dept->department_id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('departments', [
            'department_id' => $dept->department_id,
        ]);
    }

    public function test_approver_cannot_delete_department(): void
    {
        $this->seedLookups();

        $dept = Department::create([
            'department_name' => 'Temp Dept',
            'department_abbreviation' => 'TMP',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => $dept->department_id]);

        $response = $this->deleteJson("/api/departments/{$dept->department_id}");

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_delete_department(): void
    {
        $this->seedLookups();

        $dept = Department::create([
            'department_name' => 'Temp Dept',
            'department_abbreviation' => 'TMP',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $this->createAuthenticatedUser(RoleLevel::USER, ['department_id' => $dept->department_id]);

        $response = $this->deleteJson("/api/departments/{$dept->department_id}");

        $response->assertStatus(403);
    }

    // ==================== GET TEAMS ====================

    public function test_get_department_teams(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $response = $this->getJson('/api/departments/1/teams');

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonPath('data.department.department_id', 1)
            ->assertJsonStructure([
                'data' => [
                    'department',
                    'teams',
                ],
            ]);
    }

    // ==================== AUTHENTICATION ====================

    public function test_departments_require_authentication(): void
    {
        $response = $this->getJson('/api/departments');
        $response->assertStatus(401);
    }

    public function test_create_department_requires_authentication(): void
    {
        $response = $this->postJson('/api/departments', [
            'department_name' => 'Test',
            'department_abbreviation' => 'TST',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);
        $response->assertStatus(401);
    }

    public function test_update_department_requires_authentication(): void
    {
        $response = $this->putJson('/api/departments/1', [
            'department_name' => 'Test',
        ]);
        $response->assertStatus(401);
    }

    public function test_delete_department_requires_authentication(): void
    {
        $response = $this->deleteJson('/api/departments/1');
        $response->assertStatus(401);
    }
}
