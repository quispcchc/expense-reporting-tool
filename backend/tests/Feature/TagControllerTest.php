<?php

namespace Tests\Feature;

use App\Enums\RoleLevel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class TagControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    private function seedTag(int $id = 1, string $name = 'Travel'): void
    {
        DB::table('tags')->insert(['tag_id' => $id, 'tag_name' => $name]);
    }

    // ==================== INDEX (View) ====================

    public function test_any_authenticated_user_can_list_tags(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER); // regular user

        $this->seedTag(1, 'Travel');
        $this->seedTag(2, 'Office');

        $response = $this->getJson('/api/tags');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json());
    }

    // ==================== STORE (Create) ====================

    public function test_super_admin_can_create_tag(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $response = $this->postJson('/api/tags', ['tag_name' => 'New Tag']);

        $response->assertStatus(201);
        $this->assertDatabaseHas('tags', ['tag_name' => 'New Tag']);
    }

    public function test_admin_can_create_tag(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);

        $response = $this->postJson('/api/tags', ['tag_name' => 'Admin Tag']);

        $response->assertStatus(201);
    }

    public function test_approver_cannot_create_tag(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]);

        $response = $this->postJson('/api/tags', ['tag_name' => 'Unauthorized']);

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_create_tag(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER, ['department_id' => 1]);

        $response = $this->postJson('/api/tags', ['tag_name' => 'Unauthorized']);

        $response->assertStatus(403);
    }

    public function test_create_tag_capitalizes_name(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $response = $this->postJson('/api/tags', ['tag_name' => 'travel expenses']);

        $response->assertStatus(201);
        $this->assertDatabaseHas('tags', ['tag_name' => 'Travel Expenses']);
    }

    public function test_create_tag_validation_requires_name(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $response = $this->postJson('/api/tags', []);

        $response->assertStatus(422);
    }

    // ==================== UPDATE ====================

    public function test_super_admin_can_update_tag(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);
        $this->seedTag();

        $response = $this->putJson('/api/tags/1', ['tag_name' => 'Updated Name']);

        $response->assertStatus(200);
        $this->assertDatabaseHas('tags', ['tag_id' => 1, 'tag_name' => 'Updated Name']);
    }

    public function test_admin_can_update_tag(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);
        $this->seedTag();

        $response = $this->putJson('/api/tags/1', ['tag_name' => 'Admin Updated']);

        $response->assertStatus(200);
    }

    public function test_approver_cannot_update_tag(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]);
        $this->seedTag();

        $response = $this->putJson('/api/tags/1', ['tag_name' => 'Hacked']);

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_update_tag(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER, ['department_id' => 1]);
        $this->seedTag();

        $response = $this->putJson('/api/tags/1', ['tag_name' => 'Hacked']);

        $response->assertStatus(403);
    }

    // ==================== DESTROY (Delete) ====================

    public function test_super_admin_can_delete_tag(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);
        $this->seedTag();

        $response = $this->deleteJson('/api/tags/1');

        $response->assertStatus(204);
        $this->assertDatabaseMissing('tags', ['tag_id' => 1]);
    }

    public function test_admin_can_delete_tag(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::DEPARTMENT_MANAGER, ['department_id' => 1]);
        $this->seedTag();

        $response = $this->deleteJson('/api/tags/1');

        $response->assertStatus(204);
    }

    public function test_approver_cannot_delete_tag(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::TEAM_LEAD, ['department_id' => 1]);
        $this->seedTag();

        $response = $this->deleteJson('/api/tags/1');

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_delete_tag(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER, ['department_id' => 1]);
        $this->seedTag();

        $response = $this->deleteJson('/api/tags/1');

        $response->assertStatus(403);
    }

    public function test_delete_tag_linked_to_expense_returns_409(): void
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $this->seedTag(1, 'Linked Tag');

        $claim = $this->createClaimWithExpenses($user);
        $expense = $claim->expenses->first();
        $expense->tags()->sync([1]);

        $response = $this->deleteJson('/api/tags/1');

        $response->assertStatus(409);
        $this->assertDatabaseHas('tags', ['tag_id' => 1]);
    }

    // ==================== AUTHENTICATION ====================

    public function test_tags_require_authentication(): void
    {
        $response = $this->getJson('/api/tags');
        $response->assertStatus(401);
    }

    public function test_create_tag_requires_authentication(): void
    {
        $response = $this->postJson('/api/tags', ['tag_name' => 'Test']);
        $response->assertStatus(401);
    }

    public function test_update_tag_requires_authentication(): void
    {
        $response = $this->putJson('/api/tags/1', ['tag_name' => 'Test']);
        $response->assertStatus(401);
    }

    public function test_delete_tag_requires_authentication(): void
    {
        $response = $this->deleteJson('/api/tags/1');
        $response->assertStatus(401);
    }
}
