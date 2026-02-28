<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class CurrentUserRouteTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    public function test_authenticated_user_can_get_own_info()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();

        $response = $this->getJson('/api/user');

        $response->assertStatus(200);
        $response->assertJsonStructure(['user_id', 'email', 'first_name']);
    }

    public function test_get_user_requires_authentication()
    {
        $response = $this->getJson('/api/user');

        $response->assertStatus(401);
    }

    public function test_returned_user_matches_authenticated_user()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser(1, [
            'email' => 'specific@example.com',
        ]);

        $response = $this->getJson('/api/user');

        $response->assertStatus(200);
        $response->assertJsonPath('email', 'specific@example.com');
    }
}
