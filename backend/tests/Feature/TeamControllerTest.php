<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class TeamControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    public function test_super_admin_sees_all_teams(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1); // role_level=1

        $response = $this->getJson('/api/teams');

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonCount(2, 'data'); // Alpha (dept 1) + Beta (dept 2)
    }

    public function test_admin_user_sees_only_department_teams(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(2, ['department_id' => 1]); // role_level=2

        $response = $this->getJson('/api/teams');

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.team_name', 'Alpha');
    }

    public function test_create_team(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->postJson('/api/teams', [
            'team_name' => 'Gamma',
            'team_abbreviation' => 'GAM',
            'team_desc' => 'Gamma team description',
            'department_id' => 1,
            'active_status_id' => 1,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', true)
            ->assertJsonPath('data.team_name', 'Gamma');
        $this->assertDatabaseHas('teams', ['team_abbreviation' => 'GAM']);
    }

    public function test_create_team_unique_abbreviation(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->postJson('/api/teams', [
            'team_name' => 'Duplicate Alpha',
            'team_abbreviation' => 'ALP', // already seeded
            'department_id' => 1,
            'active_status_id' => 1,
        ]);

        $response->assertStatus(422);
    }

    public function test_update_team(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->putJson('/api/teams/1', [
            'team_name' => 'Alpha Updated',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonPath('data.team_name', 'Alpha Updated');
        $this->assertDatabaseHas('teams', [
            'team_id' => 1,
            'team_name' => 'Alpha Updated',
        ]);
    }

    public function test_delete_team(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->deleteJson('/api/teams/2');

        $response->assertStatus(200)
            ->assertJsonPath('status', true);
        $this->assertDatabaseMissing('teams', ['team_id' => 2]);
    }

    public function test_teams_require_authentication(): void
    {
        $response = $this->getJson('/api/teams');

        $response->assertStatus(401);
    }

    public function test_create_team_validation_requires_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->postJson('/api/teams', [
            'team_name' => 'No Dept Team',
            'team_abbreviation' => 'NDT',
            'active_status_id' => 1,
            // department_id intentionally omitted
        ]);

        $response->assertStatus(422);
    }
}
