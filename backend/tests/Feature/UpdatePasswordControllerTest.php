<?php

namespace Tests\Feature;

use App\Enums\RoleLevel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class UpdatePasswordControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    public function test_authenticated_user_can_update_password()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser(RoleLevel::USER, [
            'user_pass' => Hash::make('oldpass123'),
        ]);

        $response = $this->putJson('/api/update-password', [
            'current_password' => 'oldpass123',
            'new_password' => 'newpass123',
            'new_password_confirmation' => 'newpass123',
        ]);

        $response->assertStatus(200);
        $user->refresh();
        $this->assertTrue(Hash::check('newpass123', $user->user_pass));
    }

    public function test_update_password_fails_with_wrong_current_password()
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER, [
            'user_pass' => Hash::make('oldpass123'),
        ]);

        $response = $this->putJson('/api/update-password', [
            'current_password' => 'wrongpassword',
            'new_password' => 'newpass123',
            'new_password_confirmation' => 'newpass123',
        ]);

        $response->assertStatus(403);
    }

    public function test_update_password_requires_authentication()
    {
        $response = $this->putJson('/api/update-password', [
            'current_password' => 'oldpass123',
            'new_password' => 'newpass123',
            'new_password_confirmation' => 'newpass123',
        ]);

        $response->assertStatus(401);
    }

    public function test_update_password_validation_requires_current_password()
    {
        $this->seedLookups();
        $this->createAuthenticatedUser();

        $response = $this->putJson('/api/update-password', [
            'new_password' => 'newpass123',
            'new_password_confirmation' => 'newpass123',
        ]);

        $response->assertStatus(422);
    }

    public function test_update_password_validation_requires_new_password_min_8()
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER, [
            'user_pass' => Hash::make('oldpass123'),
        ]);

        $response = $this->putJson('/api/update-password', [
            'current_password' => 'oldpass123',
            'new_password' => 'short',
            'new_password_confirmation' => 'short',
        ]);

        $response->assertStatus(422);
    }

    public function test_update_password_validation_requires_confirmation()
    {
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::USER, [
            'user_pass' => Hash::make('oldpass123'),
        ]);

        $response = $this->putJson('/api/update-password', [
            'current_password' => 'oldpass123',
            'new_password' => 'newpass123',
        ]);

        $response->assertStatus(422);
    }
}
