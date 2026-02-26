<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class ForgetPasswordControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    public function test_send_reset_link_for_existing_user()
    {
        $this->seedLookups();
        Notification::fake();
        $user = $this->createUser([
            'email' => 'test@example.com',
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/forget-password', [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['email', 'token']);
        $this->assertDatabaseHas('password_reset_tokens', ['email' => 'test@example.com']);
    }

    public function test_send_reset_link_fails_for_nonexistent_user()
    {
        $this->seedLookups();

        $response = $this->postJson('/api/forget-password', [
            'email' => 'nobody@example.com',
        ]);

        $response->assertStatus(404);
    }

    public function test_send_reset_link_validation_requires_email()
    {
        $response = $this->postJson('/api/forget-password', []);

        $response->assertStatus(422);
    }
}
