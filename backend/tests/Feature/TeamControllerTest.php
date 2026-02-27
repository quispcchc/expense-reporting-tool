<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class TeamControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    // ── INDEX ─────────────────────────────────────────────

    public function test_super_admin_sees_all_teams(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->getJson('/api/teams');

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonCount(2, 'data');
    }

    public function test_admin_sees_only_own_department_teams(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(2, ['department_id' => 1]);

        $response = $this->getJson('/api/teams');

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.team_name', 'Alpha');
    }

    public function test_approver_sees_own_department_teams(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(3, ['department_id' => 2]);

        $response = $this->getJson('/api/teams');

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.team_name', 'Beta');
    }

    public function test_regular_user_sees_own_department_teams(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(4, ['department_id' => 1]);

        $response = $this->getJson('/api/teams');

        $response->assertStatus(200)
            ->assertJsonPath('status', true)
            ->assertJsonCount(1, 'data');
    }

    public function test_teams_require_authentication(): void
    {
        $response = $this->getJson('/api/teams');
        $response->assertStatus(401);
    }

    // ── STORE ─────────────────────────────────────────────

    public function test_super_admin_can_create_team_in_any_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->postJson('/api/teams', [
            'team_name' => 'Gamma',
            'team_abbreviation' => 'GAM',
            'team_desc' => 'Gamma team',
            'department_id' => 2,
            'active_status_id' => 1,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.team_name', 'Gamma');
        $this->assertDatabaseHas('teams', ['team_abbreviation' => 'GAM']);
    }

    public function test_admin_can_create_team_in_own_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(2, ['department_id' => 1]);

        $response = $this->postJson('/api/teams', [
            'team_name' => 'Gamma',
            'team_abbreviation' => 'GAM',
            'department_id' => 1,
            'active_status_id' => 1,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.team_name', 'Gamma');
    }

    public function test_admin_cannot_create_team_in_other_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(2, ['department_id' => 1]);

        $response = $this->postJson('/api/teams', [
            'team_name' => 'Gamma',
            'team_abbreviation' => 'GAM',
            'department_id' => 2,
            'active_status_id' => 1,
        ]);

        $response->assertStatus(403);
    }

    public function test_approver_cannot_create_team(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(3, ['department_id' => 1]);

        $response = $this->postJson('/api/teams', [
            'team_name' => 'Gamma',
            'team_abbreviation' => 'GAM',
            'department_id' => 1,
            'active_status_id' => 1,
        ]);

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_create_team(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(4, ['department_id' => 1]);

        $response = $this->postJson('/api/teams', [
            'team_name' => 'Gamma',
            'team_abbreviation' => 'GAM',
            'department_id' => 1,
            'active_status_id' => 1,
        ]);

        $response->assertStatus(403);
    }

    public function test_create_team_validation_requires_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->postJson('/api/teams', [
            'team_name' => 'No Dept Team',
            'team_abbreviation' => 'NDT',
            'active_status_id' => 1,
        ]);

        $response->assertStatus(422);
    }

    public function test_create_team_unique_abbreviation(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->postJson('/api/teams', [
            'team_name' => 'Duplicate Alpha',
            'team_abbreviation' => 'ALP',
            'department_id' => 1,
            'active_status_id' => 1,
        ]);

        $response->assertStatus(422);
    }

    // ── UPDATE ────────────────────────────────────────────

    public function test_super_admin_can_update_any_team(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->putJson('/api/teams/2', [
            'team_name' => 'Beta Updated',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.team_name', 'Beta Updated');
    }

    public function test_admin_can_update_team_in_own_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(2, ['department_id' => 1]);

        $response = $this->putJson('/api/teams/1', [
            'team_name' => 'Alpha Updated',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.team_name', 'Alpha Updated');
    }

    public function test_admin_cannot_update_team_in_other_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(2, ['department_id' => 1]);

        $response = $this->putJson('/api/teams/2', [
            'team_name' => 'Beta Updated',
        ]);

        $response->assertStatus(403);
    }

    public function test_approver_cannot_update_team(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(3, ['department_id' => 1]);

        $response = $this->putJson('/api/teams/1', [
            'team_name' => 'Alpha Updated',
        ]);

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_update_team(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(4, ['department_id' => 1]);

        $response = $this->putJson('/api/teams/1', [
            'team_name' => 'Alpha Updated',
        ]);

        $response->assertStatus(403);
    }

    // ── DESTROY ───────────────────────────────────────────

    public function test_super_admin_can_delete_any_team(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->deleteJson('/api/teams/2');

        $response->assertStatus(200);
        $this->assertDatabaseMissing('teams', ['team_id' => 2]);
    }

    public function test_admin_can_delete_team_in_own_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(2, ['department_id' => 1]);

        $response = $this->deleteJson('/api/teams/1');

        $response->assertStatus(200);
        $this->assertDatabaseMissing('teams', ['team_id' => 1]);
    }

    public function test_admin_cannot_delete_team_in_other_department(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(2, ['department_id' => 1]);

        $response = $this->deleteJson('/api/teams/2');

        $response->assertStatus(403);
        $this->assertDatabaseHas('teams', ['team_id' => 2]);
    }

    public function test_approver_cannot_delete_team(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(3, ['department_id' => 1]);

        $response = $this->deleteJson('/api/teams/1');

        $response->assertStatus(403);
        $this->assertDatabaseHas('teams', ['team_id' => 1]);
    }

    public function test_regular_user_cannot_delete_team(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(4, ['department_id' => 1]);

        $response = $this->deleteJson('/api/teams/1');

        $response->assertStatus(403);
        $this->assertDatabaseHas('teams', ['team_id' => 1]);
    }

    // ── SHOW ──────────────────────────────────────────────

    public function test_authenticated_user_can_view_team(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(4);

        $response = $this->getJson('/api/teams/1');

        $response->assertStatus(200)
            ->assertJsonPath('data.team_name', 'Alpha');
    }
}
