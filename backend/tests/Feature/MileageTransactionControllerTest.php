<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class MileageTransactionControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    // ==================== STORE ====================

    public function test_create_mileage_transaction()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();
        $data = $this->createClaimWithMileage($user);

        $response = $this->postJson('/api/mileage-transactions', [
            'mileage_id' => $data['mileage']->mileage_id,
            'transaction_date' => '2026-01-20',
            'distance_km' => 100,
            'parking_amount' => 5.00,
            'meter_km' => 2.00,
            'travel_from' => 'Montreal',
            'travel_to' => 'Quebec City',
            'buyer' => 'Test Buyer',
        ]);

        $response->assertStatus(201);
        // total = 100 * 0.5 + 5 + 2 = 57.00
        $this->assertEquals(57.00, $response->json('data.total_amount'));
        $this->assertEquals(0.5, $response->json('data.mileage_rate'));
    }

    public function test_create_mileage_transaction_with_zero_optional_fields()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();
        $data = $this->createClaimWithMileage($user);

        $response = $this->postJson('/api/mileage-transactions', [
            'mileage_id' => $data['mileage']->mileage_id,
            'transaction_date' => '2026-01-20',
            'distance_km' => 50,
            'parking_amount' => 0,
            'meter_km' => 0,
        ]);

        $response->assertStatus(201);
        // total = 50 * 0.5 = 25.00
        $this->assertEquals(25.00, $response->json('data.total_amount'));
    }

    public function test_create_mileage_transaction_validation_requires_mileage_id()
    {
        $this->seedLookups();
        $this->createAuthenticatedUser();

        $response = $this->postJson('/api/mileage-transactions', [
            'transaction_date' => '2026-01-20',
            'distance_km' => 100,
        ]);

        $response->assertStatus(422);
    }

    public function test_create_mileage_transaction_validation_requires_transaction_date()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();
        $data = $this->createClaimWithMileage($user);

        $response = $this->postJson('/api/mileage-transactions', [
            'mileage_id' => $data['mileage']->mileage_id,
            'distance_km' => 100,
        ]);

        $response->assertStatus(422);
    }

    public function test_create_mileage_transaction_validation_requires_distance_km()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();
        $data = $this->createClaimWithMileage($user);

        $response = $this->postJson('/api/mileage-transactions', [
            'mileage_id' => $data['mileage']->mileage_id,
            'transaction_date' => '2026-01-20',
        ]);

        $response->assertStatus(422);
    }

    public function test_create_mileage_transaction_validation_distance_km_min_zero()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();
        $data = $this->createClaimWithMileage($user);

        $response = $this->postJson('/api/mileage-transactions', [
            'mileage_id' => $data['mileage']->mileage_id,
            'transaction_date' => '2026-01-20',
            'distance_km' => -10,
        ]);

        $response->assertStatus(422);
    }

    public function test_create_mileage_transaction_requires_authentication()
    {
        $response = $this->postJson('/api/mileage-transactions', [
            'mileage_id' => 1,
            'transaction_date' => '2026-01-20',
            'distance_km' => 100,
        ]);

        $response->assertStatus(401);
    }

    // ==================== UPDATE ====================

    public function test_update_mileage_transaction_recalculates_total()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();
        $data = $this->createClaimWithMileage($user);

        $response = $this->putJson("/api/mileage-transactions/{$data['transaction']->transaction_id}", [
            'distance_km' => 200,
        ]);

        $response->assertStatus(200);
        $data['transaction']->refresh();
        // total = 200 * 0.5 + 5 + 0 = 105.00 (uses rate from existing transaction)
        $this->assertEquals(105.00, $data['transaction']->total_amount);
    }

    public function test_update_mileage_transaction_syncs_expense_and_claim_totals()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();
        $data = $this->createClaimWithMileage($user);

        $this->putJson("/api/mileage-transactions/{$data['transaction']->transaction_id}", [
            'distance_km' => 200,
        ]);

        $data['expense']->refresh();
        $data['claim']->refresh();
        // expense should equal sum of mileage transaction totals
        $this->assertEquals(105.00, $data['expense']->expense_amount);
        $this->assertEquals(105.00, $data['claim']->total_amount);
    }

    // ==================== DESTROY ====================

    public function test_delete_mileage_transaction()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();
        $data = $this->createClaimWithMileage($user);

        $response = $this->deleteJson("/api/mileage-transactions/{$data['transaction']->transaction_id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('mileage_transactions', ['transaction_id' => $data['transaction']->transaction_id]);
    }
}
