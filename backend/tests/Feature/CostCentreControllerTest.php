<?php

namespace Tests\Feature;

use App\Models\CostCentre;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class CostCentreControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    public function test_super_admin_can_list_cost_centres(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->getJson('/api/cost-centres');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
    }

    public function test_regular_user_cannot_list_cost_centres(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(4);

        $response = $this->getJson('/api/cost-centres');

        $response->assertStatus(403);
    }

    public function test_super_admin_can_create_cost_centre(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->postJson('/api/cost-centres', [
            'department_id' => 1,
            'cost_centre_code' => 2002,
            'description' => 'New Centre',
            'active_status_id' => 1,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);
        $this->assertDatabaseHas('cost_centres', ['cost_centre_code' => 2002]);
    }

    public function test_dept_manager_can_create_cost_centre_in_own_dept(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(2, ['department_id' => 1]);

        $response = $this->postJson('/api/cost-centres', [
            'department_id' => 1,
            'cost_centre_code' => 3003,
            'description' => 'Dept Centre',
            'active_status_id' => 1,
        ]);

        $response->assertStatus(201);
    }

    public function test_dept_manager_cannot_create_cost_centre_in_other_dept(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(2, ['department_id' => 1]);

        $response = $this->postJson('/api/cost-centres', [
            'department_id' => 2,
            'cost_centre_code' => 4004,
            'description' => 'Other Dept Centre',
            'active_status_id' => 1,
        ]);

        $response->assertStatus(403);
    }

    public function test_create_cost_centre_unique_code(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        // cost_centre_code 1001 already exists from seedLookups
        $response = $this->postJson('/api/cost-centres', [
            'department_id' => 1,
            'cost_centre_code' => 1001,
            'description' => 'Duplicate Code',
            'active_status_id' => 1,
        ]);

        $response->assertStatus(422);
    }

    public function test_update_cost_centre(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $costCentre = CostCentre::first();

        $response = $this->putJson("/api/cost-centres/{$costCentre->cost_centre_id}", [
            'department_id' => 1,
            'cost_centre_code' => $costCentre->cost_centre_code,
            'description' => 'Updated Centre',
            'active_status_id' => 1,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
    }

    public function test_delete_cost_centre(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $costCentre = CostCentre::first();

        $response = $this->deleteJson("/api/cost-centres/{$costCentre->cost_centre_id}");

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $this->assertDatabaseMissing('cost_centres', ['cost_centre_id' => $costCentre->cost_centre_id]);
    }

    public function test_cost_centres_require_authentication(): void
    {
        $response = $this->getJson('/api/cost-centres');

        $response->assertStatus(401);
    }
}
