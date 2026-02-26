<?php

namespace Tests\Feature;

use App\Models\Tag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class TagControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    public function test_list_tags()
    {
        $this->seedLookups();
        $this->createAuthenticatedUser();

        DB::table('tags')->insert([
            ['tag_id' => 1, 'tag_name' => 'Travel'],
            ['tag_id' => 2, 'tag_name' => 'Office'],
        ]);

        $response = $this->getJson('/api/tags');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json());
    }

    public function test_create_tag()
    {
        $this->seedLookups();
        $this->createAuthenticatedUser();

        $response = $this->postJson('/api/tags', [
            'tag_name' => 'New Tag',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('tags', ['tag_name' => 'New Tag']);
    }

    public function test_create_tag_capitalizes_name()
    {
        $this->seedLookups();
        $this->createAuthenticatedUser();

        $response = $this->postJson('/api/tags', [
            'tag_name' => 'travel expenses',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('tags', ['tag_name' => 'Travel Expenses']);
    }

    public function test_create_tag_validation_requires_name()
    {
        $this->seedLookups();
        $this->createAuthenticatedUser();

        $response = $this->postJson('/api/tags', []);

        $response->assertStatus(422);
    }

    public function test_update_tag()
    {
        $this->seedLookups();
        $this->createAuthenticatedUser();

        DB::table('tags')->insert([
            'tag_id' => 1,
            'tag_name' => 'Old Name',
        ]);

        $response = $this->putJson('/api/tags/1', [
            'tag_name' => 'Updated Name',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('tags', ['tag_id' => 1, 'tag_name' => 'Updated Name']);
    }

    public function test_delete_tag()
    {
        $this->seedLookups();
        $this->createAuthenticatedUser();

        DB::table('tags')->insert([
            'tag_id' => 1,
            'tag_name' => 'To Delete',
        ]);

        $response = $this->deleteJson('/api/tags/1');

        $response->assertStatus(204);
        $this->assertDatabaseMissing('tags', ['tag_id' => 1]);
    }

    public function test_delete_tag_linked_to_expense_returns_409()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();

        DB::table('tags')->insert([
            'tag_id' => 1,
            'tag_name' => 'Linked Tag',
        ]);

        $claim = $this->createClaimWithExpenses($user);
        $expense = $claim->expenses->first();
        $expense->tags()->sync([1]);

        $response = $this->deleteJson('/api/tags/1');

        $response->assertStatus(409);
        $this->assertDatabaseHas('tags', ['tag_id' => 1]);
    }

    public function test_tags_require_authentication()
    {
        $response = $this->getJson('/api/tags');

        $response->assertStatus(401);
    }
}
