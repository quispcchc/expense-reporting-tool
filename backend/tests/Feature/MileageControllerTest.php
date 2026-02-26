<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class MileageControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    // ==================== UPDATE ====================

    public function test_update_mileage_period()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();
        $data = $this->createClaimWithMileage($user);

        $response = $this->putJson("/api/mileages/{$data['mileage']->mileage_id}", [
            'period_of_from' => '2026-02-01',
            'period_of_to' => '2026-02-28',
        ]);

        $response->assertStatus(200);
        $data['mileage']->refresh();
        $this->assertEquals('2026-02-01', $data['mileage']->period_of_from->format('Y-m-d'));
        $this->assertEquals('2026-02-28', $data['mileage']->period_of_to->format('Y-m-d'));
    }

    public function test_update_mileage_partial_update()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();
        $data = $this->createClaimWithMileage($user);

        $response = $this->putJson("/api/mileages/{$data['mileage']->mileage_id}", [
            'period_of_from' => '2026-03-01',
        ]);

        $response->assertStatus(200);
        $data['mileage']->refresh();
        $this->assertEquals('2026-03-01', $data['mileage']->period_of_from->format('Y-m-d'));
    }

    public function test_update_mileage_requires_authentication()
    {
        $response = $this->putJson('/api/mileages/1', [
            'period_of_from' => '2026-02-01',
        ]);

        $response->assertStatus(401);
    }

    // ==================== DESTROY ====================

    public function test_delete_mileage()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();
        $data = $this->createClaimWithMileage($user);

        $response = $this->deleteJson("/api/mileages/{$data['mileage']->mileage_id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('mileage', ['mileage_id' => $data['mileage']->mileage_id]);
    }

    public function test_delete_mileage_cascades_to_transactions()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();
        $data = $this->createClaimWithMileage($user);
        $transactionId = $data['transaction']->transaction_id;

        $this->deleteJson("/api/mileages/{$data['mileage']->mileage_id}");

        $this->assertDatabaseMissing('mileage_transactions', ['transaction_id' => $transactionId]);
    }

    public function test_delete_mileage_requires_authentication()
    {
        $response = $this->deleteJson('/api/mileages/1');

        $response->assertStatus(401);
    }
}
