<?php

namespace Tests\Feature;

use App\Enums\RoleLevel;
use App\Models\AccountNumber;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class AccountNumberControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    // ==================== INDEX (View) ====================

    public function test_super_admin_can_list_account_numbers(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $response = $this->getJson('/api/account-numbers');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
    }

    public function test_admin_can_list_account_numbers(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);

        $response = $this->getJson('/api/account-numbers');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
    }

    public function test_approver_can_list_account_numbers(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]);

        $response = $this->getJson('/api/account-numbers');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
    }

    public function test_regular_user_cannot_list_account_numbers(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER);

        $response = $this->getJson('/api/account-numbers');

        $response->assertStatus(403);
    }

    // ==================== STORE (Create) ====================

    public function test_super_admin_can_create_account_number(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $response = $this->postJson('/api/account-numbers', [
            'account_number' => 6001,
            'description' => 'Travel Expenses',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);
        $this->assertDatabaseHas('account_numbers', ['account_number' => 6001]);
    }

    public function test_admin_can_create_account_number(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);

        $response = $this->postJson('/api/account-numbers', [
            'account_number' => 6002,
            'description' => 'Admin Created',
        ]);

        $response->assertStatus(201);
    }

    public function test_approver_cannot_create_account_number(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]);

        $response = $this->postJson('/api/account-numbers', [
            'account_number' => 7001,
            'description' => 'Unauthorized Create',
        ]);

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_create_account_number(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER);

        $response = $this->postJson('/api/account-numbers', [
            'account_number' => 7002,
            'description' => 'Unauthorized',
        ]);

        $response->assertStatus(403);
    }

    public function test_create_account_number_unique_validation(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        // account_number 5001 already exists from seedLookups
        $response = $this->postJson('/api/account-numbers', [
            'account_number' => 5001,
            'description' => 'Duplicate Number',
        ]);

        $response->assertStatus(422);
    }

    // ==================== UPDATE ====================

    public function test_super_admin_can_update_account_number(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $accountNumber = AccountNumber::first();

        $response = $this->putJson("/api/account-numbers/{$accountNumber->account_number_id}", [
            'account_number' => $accountNumber->account_number,
            'description' => 'Updated Description',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
    }

    public function test_admin_can_update_account_number(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);

        $accountNumber = AccountNumber::first();

        $response = $this->putJson("/api/account-numbers/{$accountNumber->account_number_id}", [
            'account_number' => $accountNumber->account_number,
            'description' => 'Admin Updated',
        ]);

        $response->assertStatus(200);
    }

    public function test_approver_cannot_update_account_number(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]);

        $accountNumber = AccountNumber::first();

        $response = $this->putJson("/api/account-numbers/{$accountNumber->account_number_id}", [
            'account_number' => $accountNumber->account_number,
            'description' => 'Hacked',
        ]);

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_update_account_number(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER);

        $accountNumber = AccountNumber::first();

        $response = $this->putJson("/api/account-numbers/{$accountNumber->account_number_id}", [
            'account_number' => $accountNumber->account_number,
            'description' => 'Hacked',
        ]);

        $response->assertStatus(403);
    }

    // ==================== DESTROY (Delete) ====================

    public function test_super_admin_can_delete_account_number(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $accountNumber = AccountNumber::first();

        $response = $this->deleteJson("/api/account-numbers/{$accountNumber->account_number_id}");

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $this->assertDatabaseMissing('account_numbers', ['account_number_id' => $accountNumber->account_number_id]);
    }

    public function test_admin_can_delete_account_number(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);

        $accountNumber = AccountNumber::first();

        $response = $this->deleteJson("/api/account-numbers/{$accountNumber->account_number_id}");

        $response->assertStatus(200);
    }

    public function test_approver_cannot_delete_account_number(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]);

        $accountNumber = AccountNumber::first();

        $response = $this->deleteJson("/api/account-numbers/{$accountNumber->account_number_id}");

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_delete_account_number(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER);

        $accountNumber = AccountNumber::first();

        $response = $this->deleteJson("/api/account-numbers/{$accountNumber->account_number_id}");

        $response->assertStatus(403);
    }

    // ==================== AUTHENTICATION ====================

    public function test_account_numbers_require_authentication(): void
    {
        $response = $this->getJson('/api/account-numbers');
        $response->assertStatus(401);
    }

    public function test_create_account_number_requires_authentication(): void
    {
        $response = $this->postJson('/api/account-numbers', [
            'account_number' => 9999,
            'description' => 'Test',
        ]);
        $response->assertStatus(401);
    }

    public function test_update_account_number_requires_authentication(): void
    {
        $response = $this->putJson('/api/account-numbers/1', [
            'account_number' => 5001,
            'description' => 'Test',
        ]);
        $response->assertStatus(401);
    }

    public function test_delete_account_number_requires_authentication(): void
    {
        $response = $this->deleteJson('/api/account-numbers/1');
        $response->assertStatus(401);
    }
}
