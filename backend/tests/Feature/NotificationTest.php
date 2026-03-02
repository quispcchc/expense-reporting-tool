<?php

namespace Tests\Feature;

use App\Enums\ClaimStatus;
use App\Enums\RoleLevel;
use App\Models\Claim;
use App\Models\User;
use App\Notifications\ClaimUpdatedNotification;
use App\Notifications\ResetPasswordNotification;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class NotificationTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    // ==================== VERIFY EMAIL NOTIFICATION ====================

    public function test_creating_user_sends_verify_email_notification()
    {
        Notification::fake();
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $this->postJson('/api/admin/create-user', [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'jane@example.com',
            'role_id' => RoleLevel::USER,
            'department_id' => 1,
        ]);

        $user = User::where('email', 'jane@example.com')->first();
        Notification::assertSentTo($user, VerifyEmailNotification::class);
    }

    public function test_verify_email_notification_contains_correct_token()
    {
        Notification::fake();
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $this->postJson('/api/admin/create-user', [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'jane@example.com',
            'role_id' => RoleLevel::USER,
            'department_id' => 1,
        ]);

        $user = User::where('email', 'jane@example.com')->first();

        Notification::assertSentTo($user, VerifyEmailNotification::class, function ($notification) {
            return ! empty($notification->token);
        });
    }

    public function test_verify_email_notification_mail_content()
    {
        $this->seedLookups();
        $user = $this->createUser(['email' => 'test@example.com']);
        $token = 'test-token-123';

        $notification = new VerifyEmailNotification($token);
        $mail = $notification->toMail($user);

        $this->assertEquals('Verify Your Email Address', $mail->subject);
        $this->assertStringContainsString('verify-email', $mail->actionUrl);
        $this->assertStringContainsString('token=test-token-123', $mail->actionUrl);
        $this->assertStringContainsString('email=', $mail->actionUrl);
    }

    public function test_verify_email_notification_uses_mail_channel()
    {
        $notification = new VerifyEmailNotification('token');
        $this->assertEquals(['mail'], $notification->via(null));
    }

    public function test_resend_verification_sends_notification()
    {
        Notification::fake();
        $this->seedLookups();
        $user = $this->createUser([
            'email' => 'unverified@example.com',
            'email_verified_at' => null,
            'user_pass' => null,
        ]);

        $response = $this->postJson('/api/resend-verification-email', [
            'email' => 'unverified@example.com',
        ]);

        $response->assertStatus(200);
        Notification::assertSentTo($user, VerifyEmailNotification::class);
    }

    public function test_resend_verification_does_not_send_for_already_verified()
    {
        Notification::fake();
        $this->seedLookups();
        $this->createUser([
            'email' => 'verified@example.com',
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/resend-verification-email', [
            'email' => 'verified@example.com',
        ]);

        $response->assertStatus(400);
        Notification::assertNothingSent();
    }

    public function test_resend_verification_does_not_send_for_nonexistent_user()
    {
        Notification::fake();
        $this->seedLookups();

        $response = $this->postJson('/api/resend-verification-email', [
            'email' => 'nobody@example.com',
        ]);

        $response->assertStatus(404);
        Notification::assertNothingSent();
    }

    // ==================== RESET PASSWORD NOTIFICATION ====================

    public function test_forget_password_sends_reset_notification()
    {
        Notification::fake();
        $this->seedLookups();
        $user = $this->createUser([
            'email' => 'test@example.com',
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/forget-password', [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(200);
        Notification::assertSentTo($user, ResetPasswordNotification::class);
    }

    public function test_forget_password_does_not_send_for_nonexistent_user()
    {
        Notification::fake();
        $this->seedLookups();

        $response = $this->postJson('/api/forget-password', [
            'email' => 'nobody@example.com',
        ]);

        $response->assertStatus(404);
        Notification::assertNothingSent();
    }

    public function test_reset_password_notification_contains_token()
    {
        Notification::fake();
        $this->seedLookups();
        $user = $this->createUser([
            'email' => 'test@example.com',
            'email_verified_at' => now(),
        ]);

        $this->postJson('/api/forget-password', [
            'email' => 'test@example.com',
        ]);

        Notification::assertSentTo($user, ResetPasswordNotification::class, function ($notification) {
            return ! empty($notification->token);
        });
    }

    public function test_reset_password_notification_mail_content()
    {
        $this->seedLookups();
        $user = $this->createUser(['email' => 'test@example.com']);
        $token = 'reset-token-456';

        $notification = new ResetPasswordNotification($token);
        $mail = $notification->toMail($user);

        $this->assertEquals('Reset Password', $mail->subject);
        $this->assertStringContainsString('reset-password', $mail->actionUrl);
        $this->assertStringContainsString('token=reset-token-456', $mail->actionUrl);
        $this->assertStringContainsString('email=', $mail->actionUrl);
    }

    public function test_reset_password_notification_uses_mail_channel()
    {
        $notification = new ResetPasswordNotification('token');
        $this->assertEquals(['mail'], $notification->via(null));
    }

    // ==================== CLAIM UPDATED NOTIFICATION ====================

    public function test_bulk_approve_sends_claim_updated_notification()
    {
        Notification::fake();
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);
        $claimOwner = $this->createUser(['role_id' => RoleLevel::USER]);
        $claim = $this->createClaimWithExpenses($claimOwner);

        $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim->claim_id],
        ]);

        Notification::assertSentTo($claimOwner, ClaimUpdatedNotification::class);
    }

    public function test_bulk_reject_sends_claim_updated_notification()
    {
        Notification::fake();
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);
        $claimOwner = $this->createUser(['role_id' => RoleLevel::USER]);
        $claim = $this->createClaimWithExpenses($claimOwner);

        $this->postJson('/api/claims/bulk-reject', [
            'claimIds' => [$claim->claim_id],
        ]);

        Notification::assertSentTo($claimOwner, ClaimUpdatedNotification::class);
    }

    public function test_bulk_approve_multiple_claims_sends_notification_to_each_owner()
    {
        Notification::fake();
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);

        $user1 = $this->createUser(['role_id' => RoleLevel::USER]);
        $user2 = $this->createUser(['role_id' => RoleLevel::USER]);
        $claim1 = $this->createClaimWithExpenses($user1);
        $claim2 = $this->createClaimWithExpenses($user2);

        $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim1->claim_id, $claim2->claim_id],
        ]);

        Notification::assertSentTo($user1, ClaimUpdatedNotification::class);
        Notification::assertSentTo($user2, ClaimUpdatedNotification::class);
    }

    public function test_expense_approve_sends_claim_updated_notification_when_all_approved()
    {
        Notification::fake();
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);
        $claimOwner = $this->createUser(['role_id' => RoleLevel::USER]);
        $claim = $this->createClaimWithExpenses($claimOwner, 1);
        $expense = $claim->expenses->first();

        $this->postJson("/api/expenses/{$expense->expense_id}/approve");

        Notification::assertSentTo($claimOwner, ClaimUpdatedNotification::class);
    }

    public function test_expense_reject_sends_claim_updated_notification()
    {
        Notification::fake();
        $this->seedLookups();
        $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);
        $claimOwner = $this->createUser(['role_id' => RoleLevel::USER]);
        $claim = $this->createClaimWithExpenses($claimOwner, 1);
        $expense = $claim->expenses->first();

        $this->postJson("/api/expenses/{$expense->expense_id}/reject");

        Notification::assertSentTo($claimOwner, ClaimUpdatedNotification::class);
    }

    public function test_claim_updated_notification_mail_content_on_approve()
    {
        $this->seedLookups();
        $user = $this->createUser();
        $claim = $this->createClaimWithExpenses($user);
        $claim->claim_status_id = ClaimStatus::APPROVED;
        $claim->save();
        $claim->load('status');

        $notification = new ClaimUpdatedNotification($claim);
        $mail = $notification->toMail($user);

        $this->assertEquals("Claim #{$claim->claim_id} Updated", $mail->subject);
        $this->assertStringContainsString("claims/{$claim->claim_id}/view-claim", $mail->actionUrl);
    }

    public function test_claim_updated_notification_uses_mail_channel()
    {
        $this->seedLookups();
        $user = $this->createUser();
        $claim = $this->createClaimForUser($user);

        $notification = new ClaimUpdatedNotification($claim);
        $this->assertEquals(['mail'], $notification->via($user));
    }

    public function test_failed_approval_does_not_send_notification()
    {
        Notification::fake();
        $this->seedLookups();
        $regularUser = $this->createAuthenticatedUser(RoleLevel::USER);
        $otherUser = $this->createUser(['role_id' => RoleLevel::USER]);
        $claim = $this->createClaimWithExpenses($otherUser);

        $this->postJson('/api/claims/bulk-approve', [
            'claimIds' => [$claim->claim_id],
        ]);

        Notification::assertNotSentTo($otherUser, ClaimUpdatedNotification::class);
    }

    public function test_failed_rejection_does_not_send_notification()
    {
        Notification::fake();
        $this->seedLookups();
        $regularUser = $this->createAuthenticatedUser(RoleLevel::USER);
        $otherUser = $this->createUser(['role_id' => RoleLevel::USER]);
        $claim = $this->createClaimWithExpenses($otherUser);

        $this->postJson('/api/claims/bulk-reject', [
            'claimIds' => [$claim->claim_id],
        ]);

        Notification::assertNotSentTo($otherUser, ClaimUpdatedNotification::class);
    }
}
