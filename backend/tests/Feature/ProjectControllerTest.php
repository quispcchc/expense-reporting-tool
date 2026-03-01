<?php

namespace Tests\Feature;

use App\Enums\ActiveStatus;
use App\Enums\RoleLevel;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class ProjectControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    // ==================== INDEX (View) ====================

    public function test_any_authenticated_user_can_list_projects(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER); // regular user

        $response = $this->getJson('/api/projects');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.project_name', 'Project A');
    }

    // ==================== STORE (Create) ====================

    public function test_super_admin_can_create_project(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $response = $this->postJson('/api/projects', [
            'project_name' => 'Project B',
            'project_desc' => 'Second project',
            'department_id' => 1,
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('project_name', 'Project B');
        $this->assertDatabaseHas('projects', ['project_name' => 'Project B']);
    }

    public function test_admin_can_create_project(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);

        $response = $this->postJson('/api/projects', [
            'project_name' => 'Admin Project',
            'department_id' => 1,
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(201);
    }

    public function test_approver_cannot_create_project(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]);

        $response = $this->postJson('/api/projects', [
            'project_name' => 'Unauthorized',
            'department_id' => 1,
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_create_project(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER, ['department_id' => 1]);

        $response = $this->postJson('/api/projects', [
            'project_name' => 'Unauthorized',
            'department_id' => 1,
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(403);
    }

    public function test_create_project_defaults_active_status(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $response = $this->postJson('/api/projects', [
            'project_name' => 'Project C',
            'department_id' => 1,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('active_status_id', 1);
    }

    // ==================== UPDATE ====================

    public function test_super_admin_can_update_project(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $response = $this->putJson('/api/projects/1', [
            'project_name' => 'Project A Updated',
            'department_id' => 1,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('project_name', 'Project A Updated');
        $this->assertDatabaseHas('projects', [
            'project_id' => 1,
            'project_name' => 'Project A Updated',
        ]);
    }

    public function test_admin_can_update_project(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);

        $response = $this->putJson('/api/projects/1', [
            'project_name' => 'Admin Updated',
            'department_id' => 1,
        ]);

        $response->assertStatus(200);
    }

    public function test_approver_cannot_update_project(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]);

        $response = $this->putJson('/api/projects/1', [
            'project_name' => 'Hacked',
            'department_id' => 1,
        ]);

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_update_project(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER, ['department_id' => 1]);

        $response = $this->putJson('/api/projects/1', [
            'project_name' => 'Hacked',
            'department_id' => 1,
        ]);

        $response->assertStatus(403);
    }

    // ==================== DESTROY (Delete) ====================

    public function test_super_admin_can_delete_project(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $project = Project::create([
            'project_name' => 'Deletable Project',
            'department_id' => 1,
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response = $this->deleteJson("/api/projects/{$project->project_id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('projects', [
            'project_id' => $project->project_id,
        ]);
    }

    public function test_admin_can_delete_project(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);

        $project = Project::create([
            'project_name' => 'Deletable',
            'department_id' => 1,
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response = $this->deleteJson("/api/projects/{$project->project_id}");

        $response->assertStatus(204);
    }

    public function test_approver_cannot_delete_project(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]);

        $project = Project::create([
            'project_name' => 'Protected',
            'department_id' => 1,
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response = $this->deleteJson("/api/projects/{$project->project_id}");

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_delete_project(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER, ['department_id' => 1]);

        $project = Project::create([
            'project_name' => 'Protected',
            'department_id' => 1,
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response = $this->deleteJson("/api/projects/{$project->project_id}");

        $response->assertStatus(403);
    }

    public function test_delete_project_linked_to_expense_returns_409(): void
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $this->createClaimWithExpenses($user, 1, [], ['project_id' => 1]);

        $response = $this->deleteJson('/api/projects/1');

        $response->assertStatus(409)
            ->assertJsonStructure(['message']);
    }

    // ==================== AUTHENTICATION ====================

    public function test_projects_require_authentication(): void
    {
        $response = $this->getJson('/api/projects');
        $response->assertStatus(401);
    }

    public function test_create_project_requires_authentication(): void
    {
        $response = $this->postJson('/api/projects', [
            'project_name' => 'Test',
            'department_id' => 1,
        ]);
        $response->assertStatus(401);
    }

    public function test_update_project_requires_authentication(): void
    {
        $response = $this->putJson('/api/projects/1', [
            'project_name' => 'Test',
            'department_id' => 1,
        ]);
        $response->assertStatus(401);
    }

    public function test_delete_project_requires_authentication(): void
    {
        $response = $this->deleteJson('/api/projects/1');
        $response->assertStatus(401);
    }
}
