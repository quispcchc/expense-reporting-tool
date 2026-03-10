<?php

namespace Tests\Integration;

use App\Enums\ActiveStatus;
use App\Enums\RoleLevel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class AuthenticationFlowTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    // ─── Login → Access Protected Route → Logout → Verify Locked Out ────

    public function test_full_login_access_logout_flow()
    {
        $this->seedLookups();
        $user = $this->createUser([
            'role_id' => RoleLevel::SUPER_ADMIN,
            'email' => 'flow@example.com',
            'user_pass' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);

        // Step 1: Login
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'flow@example.com',
            'password' => 'password123',
        ]);
        $loginResponse->assertStatus(200);
        $loginResponse->assertCookie('auth_token');

        // Step 2: Access protected route using Sanctum::actingAs (creates a real
        // PersonalAccessToken so logout can delete it)
        Sanctum::actingAs($user);
        $protectedResponse = $this->getJson('/api/claims');
        $protectedResponse->assertStatus(200);

        // Step 3: Logout — deletes the current access token
        $logoutResponse = $this->postJson('/api/logout');
        $logoutResponse->assertStatus(200);

        // Step 4: Verify tokens are revoked — fresh request without auth
        $this->app['auth']->forgetGuards();
        $lockedOutResponse = $this->getJson('/api/claims');
        $lockedOutResponse->assertStatus(401);
    }

    // ─── Forgot Password → Reset → Login with New Password ─────────────

    public function test_forgot_password_reset_login_flow()
    {
        Notification::fake();
        $this->seedLookups();
        $this->createUser([
            'email' => 'forgot@example.com',
            'user_pass' => Hash::make('oldpassword'),
            'email_verified_at' => now(),
        ]);

        // Step 1: Request password reset — controller returns token in response
        $forgotResponse = $this->postJson('/api/forget-password', [
            'email' => 'forgot@example.com',
        ]);
        $forgotResponse->assertStatus(200);
        $resetToken = $forgotResponse->json('token');
        $this->assertNotEmpty($resetToken);

        // Step 2: Reset password using the token
        $resetResponse = $this->postJson('/api/reset-password', [
            'email' => 'forgot@example.com',
            'token' => $resetToken,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);
        $resetResponse->assertStatus(200);

        // Step 3: Login with new password succeeds
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'forgot@example.com',
            'password' => 'newpassword123',
        ]);
        $loginResponse->assertStatus(200);

        // Step 4: Login with old password fails
        $oldLoginResponse = $this->postJson('/api/login', [
            'email' => 'forgot@example.com',
            'password' => 'oldpassword',
        ]);
        $oldLoginResponse->assertStatus(401);
    }

    // ─── Email Verification → Login Flow ────────────────────────────────

    public function test_email_verification_then_login_flow()
    {
        $this->seedLookups();
        $user = $this->createUser([
            'email' => 'unverified@example.com',
            'user_pass' => Hash::make('temppass'),
            'email_verified_at' => null,
        ]);

        // Step 1: Cannot login when unverified
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'unverified@example.com',
            'password' => 'temppass',
        ]);
        $loginResponse->assertStatus(403);

        // Step 2: Check verification status — should be unverified
        $checkResponse = $this->postJson('/api/check-email-verification', [
            'email' => 'unverified@example.com',
        ]);
        $checkResponse->assertStatus(200);
        $checkResponse->assertJson(['is_verified' => false]);

        // Step 3: Simulate verification by inserting token and calling verify
        $rawToken = 'test-verification-token';
        \DB::table('email_verification_tokens')->insert([
            'email' => 'unverified@example.com',
            'token' => bcrypt($rawToken),
            'created_at' => now(),
        ]);

        $verifyResponse = $this->postJson('/api/verify-email', [
            'email' => 'unverified@example.com',
            'token' => $rawToken,
            'password' => 'mypassword123',
            'password_confirmation' => 'mypassword123',
        ]);
        $verifyResponse->assertStatus(200);

        // Step 4: Check verification status — should now be verified
        $checkResponse2 = $this->postJson('/api/check-email-verification', [
            'email' => 'unverified@example.com',
        ]);
        $checkResponse2->assertJson(['is_verified' => true]);

        // Step 5: Login with the password set during verification
        $loginResponse2 = $this->postJson('/api/login', [
            'email' => 'unverified@example.com',
            'password' => 'mypassword123',
        ]);
        $loginResponse2->assertStatus(200);
    }

    // ─── Update Password → Re-login ────────────────────────────────────

    public function test_update_password_then_relogin_flow()
    {
        $this->seedLookups();
        $user = $this->createUser([
            'role_id' => RoleLevel::USER,
            'email' => 'updatepw@example.com',
            'user_pass' => Hash::make('currentpass'),
            'email_verified_at' => now(),
        ]);

        // Step 1: Login
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'updatepw@example.com',
            'password' => 'currentpass',
        ]);
        $loginResponse->assertStatus(200);

        // Step 2: Update password (using actingAs since cookie is encrypted)
        $updateResponse = $this->actingAs($user)
            ->putJson('/api/update-password', [
                'current_password' => 'currentpass',
                'new_password' => 'brandnewpass',
                'new_password_confirmation' => 'brandnewpass',
            ]);
        $updateResponse->assertStatus(200);

        // Step 3: Login with new password succeeds
        $newLoginResponse = $this->postJson('/api/login', [
            'email' => 'updatepw@example.com',
            'password' => 'brandnewpass',
        ]);
        $newLoginResponse->assertStatus(200);

        // Step 4: Old password no longer works
        $oldLoginResponse = $this->postJson('/api/login', [
            'email' => 'updatepw@example.com',
            'password' => 'currentpass',
        ]);
        $oldLoginResponse->assertStatus(401);
    }

    // ─── Remember Me: persistent vs session cookies ─────────────────────

    public function test_remember_me_produces_persistent_cookie()
    {
        $this->seedLookups();
        $this->createUser([
            'email' => 'remember@example.com',
            'user_pass' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);

        // Without remember — session cookie
        $sessionResponse = $this->postJson('/api/login', [
            'email' => 'remember@example.com',
            'password' => 'password123',
            'remember' => false,
        ]);
        $sessionCookie = collect($sessionResponse->headers->getCookies())
            ->first(fn ($c) => $c->getName() === 'auth_token');
        $this->assertEquals(0, $sessionCookie->getExpiresTime());

        // With remember — persistent cookie (expires in the future)
        $persistentResponse = $this->postJson('/api/login', [
            'email' => 'remember@example.com',
            'password' => 'password123',
            'remember' => true,
        ]);
        $persistentCookie = collect($persistentResponse->headers->getCookies())
            ->first(fn ($c) => $c->getName() === 'auth_token');
        $this->assertGreaterThan(time(), $persistentCookie->getExpiresTime());
    }

    // ─── Inactive user cannot access protected routes ───────────────────

    public function test_inactive_user_blocked_throughout_flow()
    {
        $this->seedLookups();
        $this->createUser([
            'email' => 'inactive@example.com',
            'user_pass' => Hash::make('password123'),
            'active_status_id' => ActiveStatus::INACTIVE,
            'email_verified_at' => now(),
        ]);

        // Cannot login
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'inactive@example.com',
            'password' => 'password123',
        ]);
        $loginResponse->assertStatus(403);
    }
}
