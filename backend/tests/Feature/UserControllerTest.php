<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class UserControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    public function test_admin_can_list_users()
    {
        $this->seedLookups();

        $admin = $this->createAuthenticatedUser();
        $this->createUser();
        $this->createUser();
        $this->createUser();

        $this->withoutMiddleware(\App\Http\Middleware\RoleCheck::class);

        $response = $this->getJson('/api/admin/users');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            '*' => ['user_id', 'first_name', 'last_name', 'email'],
        ]);
    }

    public function test_admin_can_update_user()
    {
        $this->seedLookups();

        $admin = $this->createAuthenticatedUser();
        $user = $this->createUser(['first_name' => 'Old']);

        $this->withoutMiddleware(\App\Http\Middleware\RoleCheck::class);

        $payload = ['first_name' => 'UpdatedName'];

        $response = $this->putJson("/api/admin/users/{$user->user_id}", $payload);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', ['user_id' => $user->user_id, 'first_name' => 'UpdatedName']);
    }

    public function test_admin_can_delete_user()
    {
        $this->seedLookups();

        $admin = $this->createAuthenticatedUser();
        $user = $this->createUser();

        $this->withoutMiddleware(\App\Http\Middleware\RoleCheck::class);

        $response = $this->deleteJson("/api/admin/users/{$user->user_id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('users', ['user_id' => $user->user_id]);
    }

    public function test_regular_user_cannot_list_users()
    {
        $this->seedLookups();

        // Authenticate as a regular user (role_id=4, role_name='user')
        $this->createAuthenticatedUser(4);

        $this->withoutMiddleware(\App\Http\Middleware\RoleCheck::class);

        $response = $this->getJson('/api/admin/users');

        $response->assertStatus(403);
    }

    public function test_list_users_requires_authentication()
    {
        $this->seedLookups();

        // No authenticated user - just hit the endpoint directly
        $response = $this->getJson('/api/admin/users');

        $response->assertStatus(401);
    }

    public function test_super_admin_can_edit_any_user()
    {
        $this->seedLookups();

        // Super admin in department 1
        $superAdmin = $this->createAuthenticatedUser(1, ['department_id' => 1]);

        // User in a different department
        $user = $this->createUser(['first_name' => 'Original', 'department_id' => 2]);

        $this->withoutMiddleware(\App\Http\Middleware\RoleCheck::class);

        $payload = ['first_name' => 'CrossDeptEdit'];

        $response = $this->putJson("/api/admin/users/{$user->user_id}", $payload);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', ['user_id' => $user->user_id, 'first_name' => 'CrossDeptEdit']);
    }

    public function test_admin_cannot_self_edit()
    {
        $this->seedLookups();

        // Insert an 'admin' role so the controller's authorizeUserEdit recognises it
        DB::table('roles')->insert([
            'role_id' => 5,
            'role_name' => 'admin',
            'active_status_id' => 1,
            'role_level' => 2,
        ]);

        // Authenticate as an admin (role_id=5, role_name='admin')
        $admin = $this->createAuthenticatedUser(5);

        $this->withoutMiddleware(\App\Http\Middleware\RoleCheck::class);

        // Admin tries to edit themselves
        $payload = ['first_name' => 'SelfEdit'];

        $response = $this->putJson("/api/admin/users/{$admin->user_id}", $payload);

        $response->assertStatus(403);
    }

    public function test_non_admin_cannot_edit_users()
    {
        $this->seedLookups();

        // Authenticate as a regular user (role_id=4, role_name='user')
        $regularUser = $this->createAuthenticatedUser(4);
        $targetUser = $this->createUser(['first_name' => 'Target']);

        $this->withoutMiddleware(\App\Http\Middleware\RoleCheck::class);

        $payload = ['first_name' => 'Hacked'];

        $response = $this->putJson("/api/admin/users/{$targetUser->user_id}", $payload);

        $response->assertStatus(403);
    }

    public function test_update_user_validates_unique_email()
    {
        $this->seedLookups();

        $admin = $this->createAuthenticatedUser();
        $existingUser = $this->createUser(['email' => 'taken@example.com']);
        $targetUser = $this->createUser(['email' => 'original@example.com']);

        $this->withoutMiddleware(\App\Http\Middleware\RoleCheck::class);

        // Try to update targetUser's email to one that already exists
        $payload = ['email' => 'taken@example.com'];

        $response = $this->putJson("/api/admin/users/{$targetUser->user_id}", $payload);

        $response->assertStatus(422);
    }

    public function test_delete_user_requires_authentication()
    {
        $this->seedLookups();

        $user = $this->createUser();

        // No authenticated user - just hit the endpoint directly
        $response = $this->deleteJson("/api/admin/users/{$user->user_id}");

        $response->assertStatus(401);
    }
}
