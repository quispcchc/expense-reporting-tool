<?php

namespace Tests\Feature;

use App\Models\Department;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class DepartmentControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    public function test_super_admin_sees_all_departments(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1); // role_level=1

        $response = $this->getJson('/api/departments');

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonCount(2, 'data');
    }

    public function test_regular_user_sees_only_own_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(4, ['department_id' => 1]); // role_level=4

        $response = $this->getJson('/api/departments');

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.department_id', 1);
    }

    public function test_create_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->postJson('/api/departments', [
            'department_name' => 'Finance',
            'department_abbreviation' => 'FIN',
            'active_status_id' => 1,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', true)
            ->assertJsonPath('data.department_name', 'Finance');
        $this->assertDatabaseHas('departments', ['department_abbreviation' => 'FIN']);
    }

    public function test_create_department_unique_abbreviation(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->postJson('/api/departments', [
            'department_name' => 'Duplicate Eng',
            'department_abbreviation' => 'ENG', // already seeded
            'active_status_id' => 1,
        ]);

        $response->assertStatus(422);
    }

    public function test_show_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->getJson('/api/departments/1');

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonPath('data.department_id', 1)
            ->assertJsonPath('data.active_status.active_status_id', 1);
    }

    public function test_update_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

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

    public function test_delete_department_without_teams(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        // Create a department with no teams
        $dept = Department::create([
            'department_name' => 'Temp Dept',
            'department_abbreviation' => 'TMP',
            'active_status_id' => 1,
        ]);

        $response = $this->deleteJson("/api/departments/{$dept->department_id}");

        $response->assertStatus(200)
            ->assertJsonPath('status', true);
        $this->assertDatabaseMissing('departments', [
            'department_id' => $dept->department_id,
        ]);
    }

    public function test_delete_department_with_teams_fails(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        // Department 1 has team "Alpha" seeded
        $response = $this->deleteJson('/api/departments/1');

        $response->assertStatus(422)
            ->assertJsonPath('status', false);
    }

    public function test_get_department_teams(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

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

    public function test_departments_require_authentication(): void
    {
        $response = $this->getJson('/api/departments');

        $response->assertStatus(401);
    }
}
