<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class UserControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    // ==================== INDEX (View) ====================

    public function test_super_admin_can_list_all_users(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1, ['department_id' => 1]);

        // Create users in different departments
        $this->createUser(['department_id' => 1]);
        $this->createUser(['department_id' => 2]);

        $response = $this->getJson('/api/admin/users');

        $response->assertStatus(200);
        // Super admin sees all users (self + 2 created = 3)
        $response->assertJsonCount(3);
    }

    public function test_admin_can_list_own_department_users(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(2, ['department_id' => 1]);

        $this->createUser(['department_id' => 1]);
        $this->createUser(['department_id' => 2]);

        $response = $this->getJson('/api/admin/users');

        $response->assertStatus(200);
        // Admin sees only dept 1 users (self + 1 created in dept 1 = 2)
        $response->assertJsonCount(2);
        $response->assertJsonFragment(['department_id' => 1]);
    }

    public function test_approver_can_list_team_users(): void
    {
        $this->seedLookups();
        $approver = $this->createAuthenticatedUser(3, ['department_id' => 1]);
        $this->attachUserToTeam($approver, 1);

        $teamUser = $this->createUser(['department_id' => 1]);
        $this->attachUserToTeam($teamUser, 1);

        // Create user NOT in the team
        $this->createUser(['department_id' => 1]);

        $response = $this->getJson('/api/admin/users');

        $response->assertStatus(200);
    }

    public function test_regular_user_cannot_list_users(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(4, ['department_id' => 1]);

        $response = $this->getJson('/api/admin/users');

        $response->assertStatus(403);
    }

    // ==================== UPDATE ====================

    public function test_super_admin_can_update_any_user(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1, ['department_id' => 1]);

        // User in a different department
        $user = $this->createUser(['first_name' => 'Original', 'department_id' => 2]);

        $response = $this->putJson("/api/admin/users/{$user->user_id}", [
            'first_name' => 'CrossDeptEdit',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', ['user_id' => $user->user_id, 'first_name' => 'CrossDeptEdit']);
    }

    public function test_admin_can_update_own_department_user(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(2, ['department_id' => 1]);

        $user = $this->createUser(['first_name' => 'Old', 'department_id' => 1]);

        $response = $this->putJson("/api/admin/users/{$user->user_id}", [
            'first_name' => 'UpdatedName',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', ['user_id' => $user->user_id, 'first_name' => 'UpdatedName']);
    }

    public function test_admin_cannot_update_other_department_user(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(2, ['department_id' => 1]);

        $user = $this->createUser(['first_name' => 'Original', 'department_id' => 2]);

        $response = $this->putJson("/api/admin/users/{$user->user_id}", [
            'first_name' => 'Hacked',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseHas('users', ['user_id' => $user->user_id, 'first_name' => 'Original']);
    }

    public function test_admin_cannot_self_edit(): void
    {
        $this->seedLookups();
        $admin = $this->createAuthenticatedUser(2, ['department_id' => 1]);

        $response = $this->putJson("/api/admin/users/{$admin->user_id}", [
            'first_name' => 'SelfEdit',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_cannot_edit_another_admin(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(2, ['department_id' => 1]);

        $otherAdmin = $this->createUser(['role_id' => 2, 'department_id' => 1]);

        $response = $this->putJson("/api/admin/users/{$otherAdmin->user_id}", [
            'first_name' => 'Hacked',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_cannot_promote_to_admin_role(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(2, ['department_id' => 1]);

        $user = $this->createUser(['department_id' => 1]);

        // Try to promote user to department_manager (role_id=2, level=2)
        $response = $this->putJson("/api/admin/users/{$user->user_id}", [
            'role_id' => 2,
        ]);

        $response->assertStatus(403);
    }

    public function test_approver_cannot_update_user(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(3, ['department_id' => 1]);

        $user = $this->createUser(['department_id' => 1]);

        $response = $this->putJson("/api/admin/users/{$user->user_id}", [
            'first_name' => 'Hacked',
        ]);

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_update_user(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(4, ['department_id' => 1]);

        $user = $this->createUser(['department_id' => 1]);

        $response = $this->putJson("/api/admin/users/{$user->user_id}", [
            'first_name' => 'Hacked',
        ]);

        $response->assertStatus(403);
    }

    // ==================== DESTROY (Delete) ====================

    public function test_super_admin_can_delete_any_user(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1, ['department_id' => 1]);

        $user = $this->createUser(['department_id' => 2]);

        $response = $this->deleteJson("/api/admin/users/{$user->user_id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('users', ['user_id' => $user->user_id]);
    }

    public function test_super_admin_cannot_delete_self(): void
    {
        $this->seedLookups();
        $superAdmin = $this->createAuthenticatedUser(1, ['department_id' => 1]);

        $response = $this->deleteJson("/api/admin/users/{$superAdmin->user_id}");

        $response->assertStatus(403);
    }

    public function test_admin_can_delete_own_department_user(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(2, ['department_id' => 1]);

        $user = $this->createUser(['department_id' => 1]);

        $response = $this->deleteJson("/api/admin/users/{$user->user_id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('users', ['user_id' => $user->user_id]);
    }

    public function test_admin_cannot_delete_other_department_user(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(2, ['department_id' => 1]);

        $user = $this->createUser(['department_id' => 2]);

        $response = $this->deleteJson("/api/admin/users/{$user->user_id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('users', ['user_id' => $user->user_id]);
    }

    public function test_admin_cannot_delete_self(): void
    {
        $this->seedLookups();
        $admin = $this->createAuthenticatedUser(2, ['department_id' => 1]);

        $response = $this->deleteJson("/api/admin/users/{$admin->user_id}");

        $response->assertStatus(403);
    }

    public function test_admin_cannot_delete_another_admin(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(2, ['department_id' => 1]);

        $otherAdmin = $this->createUser(['role_id' => 2, 'department_id' => 1]);

        $response = $this->deleteJson("/api/admin/users/{$otherAdmin->user_id}");

        $response->assertStatus(403);
    }

    public function test_approver_cannot_delete_user(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(3, ['department_id' => 1]);

        $user = $this->createUser(['department_id' => 1]);

        $response = $this->deleteJson("/api/admin/users/{$user->user_id}");

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_delete_user(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(4, ['department_id' => 1]);

        $user = $this->createUser(['department_id' => 1]);

        $response = $this->deleteJson("/api/admin/users/{$user->user_id}");

        $response->assertStatus(403);
    }

    // ==================== VALIDATION ====================

    public function test_update_user_validates_unique_email(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(1);

        $existingUser = $this->createUser(['email' => 'taken@example.com']);
        $targetUser = $this->createUser(['email' => 'original@example.com']);

        $response = $this->putJson("/api/admin/users/{$targetUser->user_id}", [
            'email' => 'taken@example.com',
        ]);

        $response->assertStatus(422);
    }

    // ==================== AUTHENTICATION ====================

    public function test_list_users_requires_authentication(): void
    {
        $response = $this->getJson('/api/admin/users');
        $response->assertStatus(401);
    }

    public function test_update_user_requires_authentication(): void
    {
        $response = $this->putJson('/api/admin/users/1', ['first_name' => 'Test']);
        $response->assertStatus(401);
    }

    public function test_delete_user_requires_authentication(): void
    {
        $response = $this->deleteJson('/api/admin/users/1');
        $response->assertStatus(401);
    }
}
