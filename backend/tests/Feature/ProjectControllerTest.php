<?php

namespace Tests\Feature;

use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class ProjectControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    public function test_list_projects(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->getJson('/api/projects');

        $response->assertStatus(200)
            ->assertJsonCount(1) // "Project A" seeded
            ->assertJsonPath('0.project_name', 'Project A');
    }

    public function test_create_project(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->postJson('/api/projects', [
            'project_name' => 'Project B',
            'project_desc' => 'Second project',
            'department_id' => 1,
            'active_status_id' => 1,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('project_name', 'Project B')
            ->assertJsonPath('active_status_id', 1);
        $this->assertDatabaseHas('projects', ['project_name' => 'Project B']);
    }

    public function test_create_project_defaults_active_status(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->postJson('/api/projects', [
            'project_name' => 'Project C',
            'department_id' => 1,
            // active_status_id intentionally omitted
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('active_status_id', 1);
    }

    public function test_update_project(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

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

    public function test_delete_project(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        // Create a standalone project with no expenses linked
        $project = Project::create([
            'project_name' => 'Deletable Project',
            'department_id' => 1,
            'active_status_id' => 1,
        ]);

        $response = $this->deleteJson("/api/projects/{$project->project_id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('projects', [
            'project_id' => $project->project_id,
        ]);
    }

    public function test_delete_project_linked_to_expense_returns_409(): void
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser(1);

        // Create a claim with expense referencing project_id=1
        $this->createClaimWithExpenses($user, 1, [], ['project_id' => 1]);

        $response = $this->deleteJson('/api/projects/1');

        $response->assertStatus(409)
            ->assertJsonStructure(['message']);
    }

    public function test_projects_require_authentication(): void
    {
        $response = $this->getJson('/api/projects');

        $response->assertStatus(401);
    }
}
