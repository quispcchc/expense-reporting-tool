<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class SettingsControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    public function test_get_settings(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser();

        $response = $this->getJson('/api/settings');

        $response->assertStatus(200);
        $response->assertJsonPath('data.mileage_rate', '0.5');
    }

    public function test_update_mileage_rate(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser();

        $response = $this->putJson('/api/settings', [
            'mileage_rate' => 0.65,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.mileage_rate', '0.65');
    }

    public function test_update_mileage_rate_validation_min_zero(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser();

        $response = $this->putJson('/api/settings', [
            'mileage_rate' => -1,
        ]);

        $response->assertStatus(422);
    }

    public function test_settings_require_authentication(): void
    {
        $response = $this->getJson('/api/settings');

        $response->assertStatus(401);
    }

    public function test_get_settings_returns_correct_format(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser();

        $response = $this->getJson('/api/settings');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => [
                'mileage_rate',
            ],
        ]);
        $response->assertJsonPath('status', true);
    }
}
