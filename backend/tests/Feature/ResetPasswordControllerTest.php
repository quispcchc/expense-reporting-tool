<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class ResetPasswordControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    public function test_user_can_reset_password_with_valid_token()
    {
        $this->seedLookups();
        $user = $this->createUser([
            'email' => 'test@example.com',
            'email_verified_at' => now(),
        ]);

        $token = Password::createToken($user);

        $response = $this->postJson('/api/reset-password', [
            'email' => 'test@example.com',
            'token' => $token,
            'password' => 'newpass123',
            'password_confirmation' => 'newpass123',
        ]);

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $user->refresh();
        $this->assertTrue(Hash::check('newpass123', $user->user_pass));
    }

    public function test_reset_password_fails_with_invalid_token()
    {
        $this->seedLookups();
        $this->createUser([
            'email' => 'test@example.com',
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/reset-password', [
            'email' => 'test@example.com',
            'token' => 'invalid-token',
            'password' => 'newpass123',
            'password_confirmation' => 'newpass123',
        ]);

        $response->assertStatus(400);
    }

    public function test_reset_password_fails_with_nonexistent_email()
    {
        $response = $this->postJson('/api/reset-password', [
            'email' => 'nobody@example.com',
            'token' => 'some-token',
            'password' => 'newpass123',
            'password_confirmation' => 'newpass123',
        ]);

        $response->assertStatus(422);
    }

    public function test_reset_password_validation_requires_password_min_8()
    {
        $response = $this->postJson('/api/reset-password', [
            'email' => 'test@example.com',
            'token' => 'some-token',
            'password' => 'short',
            'password_confirmation' => 'short',
        ]);

        $response->assertStatus(422);
    }

    public function test_reset_password_validation_requires_password_confirmation()
    {
        $response = $this->postJson('/api/reset-password', [
            'email' => 'test@example.com',
            'token' => 'some-token',
            'password' => 'newpass123',
        ]);

        $response->assertStatus(422);
    }
}
