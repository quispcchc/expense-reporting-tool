<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class LoginControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    public function test_user_can_login_with_valid_credentials()
    {
        $this->seedLookups();
        $user = $this->createUser([
            'role_id' => 1,
            'email' => 'test@example.com',
            'user_pass' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => ['user'],
        ]);
    }

    public function test_login_sets_httponly_auth_cookie()
    {
        $this->seedLookups();
        $this->createUser([
            'role_id' => 1,
            'email' => 'test@example.com',
            'user_pass' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $response->assertCookie('auth_token');
    }

    public function test_login_without_remember_sets_session_cookie()
    {
        $this->seedLookups();
        $this->createUser([
            'role_id' => 1,
            'email' => 'test@example.com',
            'user_pass' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
            'remember' => false,
        ]);

        $response->assertStatus(200);
        $cookie = collect($response->headers->getCookies())
            ->first(fn ($c) => $c->getName() === 'auth_token');

        $this->assertNotNull($cookie);
        // Session cookie: expires at 0 (end of browser session)
        $this->assertEquals(0, $cookie->getExpiresTime());
    }

    public function test_login_with_remember_sets_persistent_cookie()
    {
        $this->seedLookups();
        $this->createUser([
            'role_id' => 1,
            'email' => 'test@example.com',
            'user_pass' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
            'remember' => true,
        ]);

        $response->assertStatus(200);
        $cookie = collect($response->headers->getCookies())
            ->first(fn ($c) => $c->getName() === 'auth_token');

        $this->assertNotNull($cookie);
        // Persistent cookie: should expire ~30 days from now
        $this->assertGreaterThan(time(), $cookie->getExpiresTime());
    }

    public function test_login_returns_user_info()
    {
        $this->seedLookups();
        $user = $this->createUser([
            'role_id' => 1,
            'email' => 'test@example.com',
            'user_pass' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'user' => ['full_name', 'email', 'role_name', 'department_id', 'position_id'],
            ],
        ]);
    }

    public function test_login_fails_with_wrong_password()
    {
        $this->seedLookups();
        $this->createUser([
            'email' => 'test@example.com',
            'user_pass' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
        $response->assertJson(['status' => false]);
    }

    public function test_login_fails_with_nonexistent_email()
    {
        $this->seedLookups();

        $response = $this->postJson('/api/login', [
            'email' => 'nobody@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(401);
    }

    public function test_login_fails_for_inactive_user()
    {
        $this->seedLookups();
        $this->createUser([
            'email' => 'test@example.com',
            'user_pass' => Hash::make('password123'),
            'active_status_id' => 2,
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(403);
    }

    public function test_login_fails_for_unverified_email()
    {
        $this->seedLookups();
        $this->createUser([
            'email' => 'test@example.com',
            'user_pass' => Hash::make('password123'),
            'email_verified_at' => null,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(403);
    }

    public function test_login_validation_requires_email()
    {
        $response = $this->postJson('/api/login', [
            'password' => 'password123',
        ]);

        $response->assertStatus(422);
    }

    public function test_login_validation_requires_password()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(422);
    }

    public function test_login_validation_requires_valid_email_format()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'not-an-email',
            'password' => 'password123',
        ]);

        $response->assertStatus(422);
    }
}
