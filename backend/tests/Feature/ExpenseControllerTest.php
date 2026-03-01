<?php

namespace Tests\Feature;

use App\Models\Claim;
use App\Models\Expense;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use App\Enums\ClaimStatus;
use App\Enums\RoleLevel;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class ExpenseControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    private function seedTags(): void
    {
        DB::table('tags')->insert([
            ['tag_id' => 1, 'tag_name' => 'Travel'],
            ['tag_id' => 2, 'tag_name' => 'Office'],
        ]);
    }

    // ==================== INDEX ====================

    public function test_authenticated_user_can_list_expenses()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();
        $this->createClaimWithExpenses($user);

        $response = $this->getJson('/api/expenses');

        $response->assertStatus(200);
    }

    public function test_list_expenses_requires_authentication()
    {
        $response = $this->getJson('/api/expenses');

        $response->assertStatus(401);
    }

    // ==================== UPDATE ====================

    public function test_update_expense_fields()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();
        $claim = $this->createClaimWithExpenses($user);
        $expense = $claim->expenses->first();

        $response = $this->putJson("/api/expenses/{$expense->expense_id}", [
            'buyer_name' => 'Updated Buyer',
            'vendor_name' => 'Updated Vendor',
            'expense_amount' => 150.00,
        ]);

        $response->assertStatus(200);
        $expense->refresh();
        $this->assertEquals('Updated Buyer', $expense->buyer_name);
        $this->assertEquals(150.00, $expense->expense_amount);
    }

    public function test_update_expense_recalculates_claim_total()
    {
        $this->seedLookups();
        $user = $this->createAuthenticatedUser();
        $claim = $this->createClaimWithExpenses($user, 2, [], ['expense_amount' => 50.00]);
        $expense = $claim->expenses->first();

        $response = $this->putJson("/api/expenses/{$expense->expense_id}", [
            'expense_amount' => 75.00,
        ]);

        $response->assertStatus(200);
        $claim->refresh();
        $this->assertEquals(125.00, $claim->total_amount);
    }

    public function test_update_expense_syncs_tags()
    {
        $this->seedLookups();
        $this->seedTags();
        $user = $this->createAuthenticatedUser();
        $claim = $this->createClaimWithExpenses($user);
        $expense = $claim->expenses->first();

        $response = $this->putJson("/api/expenses/{$expense->expense_id}", [
            'tags' => [1, 2],
        ]);

        $response->assertStatus(200);
        $this->assertCount(2, $expense->fresh()->tags);
    }

    public function test_update_expense_with_empty_tags_detaches_all()
    {
        $this->seedLookups();
        $this->seedTags();
        $user = $this->createAuthenticatedUser();
        $claim = $this->createClaimWithExpenses($user);
        $expense = $claim->expenses->first();
        $expense->tags()->sync([1, 2]);

        $response = $this->putJson("/api/expenses/{$expense->expense_id}", [
            'tags' => [],
        ]);

        $response->assertStatus(200);
        $this->assertCount(0, $expense->fresh()->tags);
    }

    // ==================== APPROVE ====================

    public function test_super_admin_can_approve_expense()
    {
        $this->seedLookups();
        Notification::fake();
        $superAdmin = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);
        $regularUser = $this->createUser(['role_id' => RoleLevel::USER]);
        $claim = $this->createClaimWithExpenses($regularUser);
        $expense = $claim->expenses->first();

        $response = $this->postJson("/api/expenses/{$expense->expense_id}/approve");

        $response->assertStatus(200);
        $expense->refresh();
        $this->assertEquals(ClaimStatus::APPROVED, $expense->approval_status_id);
    }

    public function test_approving_all_expenses_cascades_claim_to_approved()
    {
        $this->seedLookups();
        Notification::fake();
        $superAdmin = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);
        $regularUser = $this->createUser(['role_id' => RoleLevel::USER]);
        $claim = $this->createClaimWithExpenses($regularUser, 2);
        $expenses = $claim->expenses;

        $this->postJson("/api/expenses/{$expenses[0]->expense_id}/approve");
        $this->postJson("/api/expenses/{$expenses[1]->expense_id}/approve");

        $claim->refresh();
        $this->assertEquals(ClaimStatus::APPROVED, $claim->claim_status_id);
    }

    public function test_approving_one_of_two_expenses_keeps_claim_pending()
    {
        $this->seedLookups();
        Notification::fake();
        $superAdmin = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);
        $regularUser = $this->createUser(['role_id' => RoleLevel::USER]);
        $claim = $this->createClaimWithExpenses($regularUser, 2);
        $expense = $claim->expenses->first();

        $this->postJson("/api/expenses/{$expense->expense_id}/approve");

        $claim->refresh();
        $this->assertEquals(ClaimStatus::PENDING, $claim->claim_status_id);
    }

    public function test_unauthorized_user_cannot_approve_expense()
    {
        $this->seedLookups();
        $regularUser = $this->createAuthenticatedUser(RoleLevel::USER);
        $otherUser = $this->createUser(['role_id' => RoleLevel::USER]);
        $claim = $this->createClaimWithExpenses($otherUser);
        $expense = $claim->expenses->first();

        $response = $this->postJson("/api/expenses/{$expense->expense_id}/approve");

        $response->assertStatus(403);
    }

    // ==================== REJECT ====================

    public function test_super_admin_can_reject_expense()
    {
        $this->seedLookups();
        Notification::fake();
        $superAdmin = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);
        $regularUser = $this->createUser(['role_id' => RoleLevel::USER]);
        $claim = $this->createClaimWithExpenses($regularUser);
        $expense = $claim->expenses->first();

        $response = $this->postJson("/api/expenses/{$expense->expense_id}/reject");

        $response->assertStatus(200);
        $expense->refresh();
        $this->assertEquals(ClaimStatus::REJECTED, $expense->approval_status_id);
    }

    public function test_rejecting_any_expense_cascades_claim_to_rejected()
    {
        $this->seedLookups();
        Notification::fake();
        $superAdmin = $this->createAuthenticatedUser(RoleLevel::SUPER_ADMIN);
        $regularUser = $this->createUser(['role_id' => RoleLevel::USER]);
        $claim = $this->createClaimWithExpenses($regularUser, 2);
        $expense = $claim->expenses->first();

        $this->postJson("/api/expenses/{$expense->expense_id}/reject");

        $claim->refresh();
        $this->assertEquals(ClaimStatus::REJECTED, $claim->claim_status_id);
    }

    public function test_unauthorized_user_cannot_reject_expense()
    {
        $this->seedLookups();
        $regularUser = $this->createAuthenticatedUser(RoleLevel::USER);
        $otherUser = $this->createUser(['role_id' => RoleLevel::USER]);
        $claim = $this->createClaimWithExpenses($otherUser);
        $expense = $claim->expenses->first();

        $response = $this->postJson("/api/expenses/{$expense->expense_id}/reject");

        $response->assertStatus(403);
    }

    // ==================== DESTROY ====================

    public function test_delete_expense_returns_204()
    {
        $this->seedLookups();
        Notification::fake();
        $user = $this->createAuthenticatedUser();
        $claim = $this->createClaimWithExpenses($user);
        $expense = $claim->expenses->first();

        $response = $this->deleteJson("/api/expenses/{$expense->expense_id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('expenses', ['expense_id' => $expense->expense_id]);
    }

    public function test_delete_expense_removes_expense_from_claim()
    {
        $this->seedLookups();
        Notification::fake();
        $user = $this->createAuthenticatedUser();
        $claim = $this->createClaimWithExpenses($user, 2, [], ['expense_amount' => 50.00]);

        $expense = $claim->expenses->first();
        $this->deleteJson("/api/expenses/{$expense->expense_id}");

        $this->assertEquals(1, Expense::where('claim_id', $claim->claim_id)->count());
    }
}
