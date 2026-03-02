<?php

namespace Tests\Feature;

use App\Enums\ActiveStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class RoleControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedLookups();
    }

    public function test_list_roles(): void
    {
        $this->createAuthenticatedUser();

        $response = $this->getJson('/api/roles');

        $response->assertStatus(200);
        $response->assertJsonCount(4);
        $response->assertJsonFragment(['role_name' => 'super_admin']);
        $response->assertJsonFragment(['role_name' => 'user']);
    }

    public function test_create_role(): void
    {
        $this->createAuthenticatedUser();

        $response = $this->postJson('/api/roles', [
            'role_id' => 5,
            'role_name' => 'moderator',
            'active_status_id' => ActiveStatus::ACTIVE,
            'role_level' => 5,
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment(['message' => 'Role created']);
        $response->assertJsonPath('role.role_name', 'moderator');
        $this->assertDatabaseHas('roles', [
            'role_id' => 5,
            'role_name' => 'moderator',
        ]);
    }

    public function test_create_role_validation_requires_role_name(): void
    {
        $this->createAuthenticatedUser();

        $response = $this->postJson('/api/roles', [
            'role_id' => 5,
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('role_name');
    }

    public function test_create_role_validation_unique_role_name(): void
    {
        $this->createAuthenticatedUser();

        $response = $this->postJson('/api/roles', [
            'role_id' => 5,
            'role_name' => 'super_admin',
            'active_status_id' => ActiveStatus::ACTIVE,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('role_name');
    }

    public function test_update_role(): void
    {
        $this->createAuthenticatedUser();

        $response = $this->putJson('/api/roles/4', [
            'active_status_id' => ActiveStatus::ACTIVE,
            'role_name' => 'basic_user',
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment(['message' => 'Role updated']);
        $response->assertJsonPath('role.role_name', 'basic_user');
        $this->assertDatabaseHas('roles', [
            'role_id' => 4,
            'role_name' => 'basic_user',
        ]);
    }

    public function test_update_role_unique_name_ignores_self(): void
    {
        $this->createAuthenticatedUser();

        $response = $this->putJson('/api/roles/4', [
            'active_status_id' => ActiveStatus::ACTIVE,
            'role_name' => 'user',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('role.role_name', 'user');
    }

    public function test_delete_role(): void
    {
        $this->createAuthenticatedUser();

        // Create a role to delete (not one referenced by users)
        DB::table('roles')->insert([
            'role_id' => 5,
            'role_name' => 'temporary',
            'active_status_id' => ActiveStatus::ACTIVE,
            'role_level' => 5,
        ]);

        $response = $this->deleteJson('/api/roles/5');

        $response->assertStatus(200);
        $response->assertJsonFragment(['message' => 'Role deleted']);
        $this->assertDatabaseMissing('roles', ['role_id' => 5]);
    }

    public function test_roles_require_authentication(): void
    {
        $response = $this->getJson('/api/roles');

        $response->assertStatus(401);
    }
}
