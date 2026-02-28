<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class SettingsControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    // ==================== INDEX (View) ====================

    public function test_any_authenticated_user_can_view_settings(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(4); // regular user

        $response = $this->getJson('/api/settings');

        $response->assertStatus(200);
        $response->assertJsonPath('status', true);
        $response->assertJsonPath('data.mileage_rate', '0.5');
    }

    public function test_get_settings_returns_correct_format(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->getJson('/api/settings');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => [
                'mileage_rate',
            ],
        ]);
    }

    // ==================== UPDATE ====================

    public function test_super_admin_can_update_settings(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->putJson('/api/settings', [
            'mileage_rate' => 0.65,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.mileage_rate', '0.65');
    }

    public function test_admin_can_update_settings(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(2, ['department_id' => 1]);

        $response = $this->putJson('/api/settings', [
            'mileage_rate' => 0.70,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.mileage_rate', '0.7');
    }

    public function test_approver_cannot_update_settings(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(3, ['department_id' => 1]);

        $response = $this->putJson('/api/settings', [
            'mileage_rate' => 0.99,
        ]);

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_update_settings(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(4, ['department_id' => 1]);

        $response = $this->putJson('/api/settings', [
            'mileage_rate' => 0.99,
        ]);

        $response->assertStatus(403);
    }

    public function test_update_mileage_rate_validation_min_zero(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->putJson('/api/settings', [
            'mileage_rate' => -1,
        ]);

        $response->assertStatus(422);
    }

    // ==================== AUTHENTICATION ====================

    public function test_settings_require_authentication(): void
    {
        $response = $this->getJson('/api/settings');
        $response->assertStatus(401);
    }

    public function test_update_settings_requires_authentication(): void
    {
        $response = $this->putJson('/api/settings', [
            'mileage_rate' => 0.65,
        ]);
        $response->assertStatus(401);
    }
}
