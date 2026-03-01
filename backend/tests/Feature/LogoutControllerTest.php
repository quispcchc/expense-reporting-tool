<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class LogoutControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    public function test_authenticated_user_can_logout()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();

        $response = $this->postJson('/api/logout');

        $response->assertStatus(200);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_logout_clears_auth_token_cookie()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();

        $response = $this->postJson('/api/logout');

        $response->assertStatus(200);
        // The auth_token cookie should be expired (forgotten)
        $cookie = collect($response->headers->getCookies())
            ->first(fn ($c) => $c->getName() === 'auth_token');

        $this->assertNotNull($cookie);
        // A forgotten cookie has an expiration time in the past
        $this->assertLessThan(time(), $cookie->getExpiresTime());
    }

    public function test_unauthenticated_user_cannot_logout()
    {
        $response = $this->postJson('/api/logout');

        $response->assertStatus(401);
    }
}
