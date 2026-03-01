<?php

namespace Tests\Unit;

use App\Enums\RoleLevel;
use App\Models\User;
use App\Models\Claim;
use App\Models\Expense;
use App\Models\Mileage;
use App\Models\MileageTransaction;
use App\Models\Tag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class ModelRelationshipTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedLookups();
    }

    public function test_user_belongs_to_role(): void
    {
        $user = $this->createUser(['role_id' => RoleLevel::DEPARTMENT_MANAGER]);

        $this->assertNotNull($user->role);
        $this->assertEquals(RoleLevel::DEPARTMENT_MANAGER, $user->role->role_id);
        $this->assertInstanceOf(\App\Models\Role::class, $user->role);
    }

    public function test_user_has_many_claims(): void
    {
        $user = $this->createUser();
        $claim = $this->createClaimForUser($user);

        $user->refresh();

        $this->assertTrue($user->claims->contains($claim));
        $this->assertCount(1, $user->claims);
    }

    public function test_claim_belongs_to_user(): void
    {
        $user = $this->createUser();
        $claim = $this->createClaimForUser($user);

        $this->assertNotNull($claim->user);
        $this->assertEquals($user->user_id, $claim->user->user_id);
    }

    public function test_claim_has_many_expenses(): void
    {
        $user = $this->createUser();
        $claim = $this->createClaimWithExpenses($user, 3);

        $this->assertCount(3, $claim->expenses);
    }

    public function test_expense_belongs_to_claim(): void
    {
        $user = $this->createUser();
        $claim = $this->createClaimWithExpenses($user, 1);

        $expense = $claim->expenses->first();

        $this->assertNotNull($expense->claim);
        $this->assertEquals($claim->claim_id, $expense->claim->claim_id);
    }

    public function test_expense_belongs_to_many_tags(): void
    {
        DB::table('tags')->insert(['tag_id' => 1, 'tag_name' => 'Travel']);

        $user = $this->createUser();
        $claim = $this->createClaimWithExpenses($user, 1);
        $expense = $claim->expenses->first();

        $expense->tags()->sync([1]);
        $expense->refresh();

        $this->assertCount(1, $expense->tags);
        $this->assertEquals('Travel', $expense->tags->first()->tag_name);
    }

    public function test_mileage_has_many_transactions(): void
    {
        $user = $this->createUser();
        $data = $this->createClaimWithMileage($user);

        $mileage = $data['mileage'];
        $mileage->refresh();

        $this->assertCount(1, $mileage->transactions);
    }

    public function test_mileage_transaction_belongs_to_mileage(): void
    {
        $user = $this->createUser();
        $data = $this->createClaimWithMileage($user);

        $transaction = $data['transaction'];
        $transaction->refresh();

        $this->assertNotNull($transaction->mileage);
        $this->assertEquals($data['mileage']->mileage_id, $transaction->mileage->mileage_id);
    }
}
