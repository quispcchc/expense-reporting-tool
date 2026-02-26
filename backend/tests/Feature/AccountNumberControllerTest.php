<?php

namespace Tests\Feature;

use App\Models\AccountNumber;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class AccountNumberControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    public function test_super_admin_can_list_account_numbers(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->getJson('/api/account-numbers');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
    }

    public function test_team_lead_can_list_account_numbers(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(3);

        $response = $this->getJson('/api/account-numbers');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
    }

    public function test_regular_user_cannot_list_account_numbers(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(4);

        $response = $this->getJson('/api/account-numbers');

        $response->assertStatus(403);
    }

    public function test_super_admin_can_create_account_number(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $response = $this->postJson('/api/account-numbers', [
            'account_number' => 6001,
            'description' => 'Travel Expenses',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);
        $this->assertDatabaseHas('account_numbers', ['account_number' => 6001]);
    }

    public function test_team_lead_cannot_create_account_number(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(3);

        $response = $this->postJson('/api/account-numbers', [
            'account_number' => 7001,
            'description' => 'Unauthorized Create',
        ]);

        $response->assertStatus(403);
    }

    public function test_create_account_number_unique_validation(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        // account_number 5001 already exists from seedLookups
        $response = $this->postJson('/api/account-numbers', [
            'account_number' => 5001,
            'description' => 'Duplicate Number',
        ]);

        $response->assertStatus(422);
    }

    public function test_update_account_number(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $accountNumber = AccountNumber::first();

        $response = $this->putJson("/api/account-numbers/{$accountNumber->account_number_id}", [
            'account_number' => $accountNumber->account_number,
            'description' => 'Updated Description',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
    }

    public function test_delete_account_number(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $accountNumber = AccountNumber::first();

        $response = $this->deleteJson("/api/account-numbers/{$accountNumber->account_number_id}");

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $this->assertDatabaseMissing('account_numbers', ['account_number_id' => $accountNumber->account_number_id]);
    }
}
