<?php

namespace Tests\Traits;

use App\Enums\ActiveStatus;
use App\Enums\ClaimStatus;
use App\Enums\ClaimType;
use App\Enums\RoleLevel;
use App\Models\Claim;
use App\Models\Expense;
use App\Models\Mileage;
use App\Models\MileageTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

trait SeedsLookups
{
    protected function seedLookups(): void
    {
        DB::table('active_status')->insert([
            ['active_status_id' => ActiveStatus::ACTIVE, 'active_status_name' => 'active'],
            ['active_status_id' => ActiveStatus::INACTIVE, 'active_status_name' => 'inactive'],
        ]);

        DB::table('roles')->insert([
            ['role_id' => RoleLevel::SUPER_ADMIN, 'role_name' => 'super_admin', 'active_status_id' => ActiveStatus::ACTIVE, 'role_level' => RoleLevel::SUPER_ADMIN],
            ['role_id' => RoleLevel::DEPARTMENT_MANAGER, 'role_name' => 'department_manager', 'active_status_id' => ActiveStatus::ACTIVE, 'role_level' => RoleLevel::DEPARTMENT_MANAGER],
            ['role_id' => RoleLevel::TEAM_LEAD, 'role_name' => 'team_lead', 'active_status_id' => ActiveStatus::ACTIVE, 'role_level' => RoleLevel::TEAM_LEAD],
            ['role_id' => RoleLevel::USER, 'role_name' => 'user', 'active_status_id' => ActiveStatus::ACTIVE, 'role_level' => RoleLevel::USER],
        ]);

        DB::table('positions')->insert([
            ['position_id' => 1, 'position_name' => 'Member', 'active_status_id' => ActiveStatus::ACTIVE],
        ]);

        DB::table('departments')->insert([
            ['department_id' => 1, 'department_name' => 'Engineering',
             'department_abbreviation' => 'ENG', 'active_status_id' => ActiveStatus::ACTIVE],
            ['department_id' => 2, 'department_name' => 'Marketing',
             'department_abbreviation' => 'MKT', 'active_status_id' => ActiveStatus::ACTIVE],
        ]);

        DB::table('teams')->insert([
            ['team_id' => 1, 'team_name' => 'Alpha', 'team_abbreviation' => 'ALP',
             'active_status_id' => ActiveStatus::ACTIVE, 'department_id' => 1],
            ['team_id' => 2, 'team_name' => 'Beta', 'team_abbreviation' => 'BET',
             'active_status_id' => ActiveStatus::ACTIVE, 'department_id' => 2],
        ]);

        DB::table('claim_status')->insert([
            ['claim_status_id' => ClaimStatus::PENDING, 'claim_status_name' => 'Pending'],
            ['claim_status_id' => ClaimStatus::APPROVED, 'claim_status_name' => 'Approved'],
            ['claim_status_id' => ClaimStatus::REJECTED, 'claim_status_name' => 'Rejected'],
        ]);

        DB::table('claim_types')->insert([
            ['claim_type_id' => ClaimType::REIMBURSEMENT, 'claim_type_name' => 'Expense', 'active_status_id' => ActiveStatus::ACTIVE],
            ['claim_type_id' => ClaimType::PETTY_CASH, 'claim_type_name' => 'Petty Cash', 'active_status_id' => ActiveStatus::ACTIVE],
            ['claim_type_id' => ClaimType::CORPORATE_CARD, 'claim_type_name' => 'Corporate Card', 'active_status_id' => ActiveStatus::ACTIVE],
        ]);

        DB::table('approval_status')->insert([
            ['approval_status_id' => ClaimStatus::PENDING, 'approval_status_name' => 'Pending'],
            ['approval_status_id' => ClaimStatus::APPROVED, 'approval_status_name' => 'Approved'],
            ['approval_status_id' => ClaimStatus::REJECTED, 'approval_status_name' => 'Rejected'],
        ]);

        DB::table('projects')->insert([
            ['project_id' => 1, 'project_name' => 'Project A',
             'active_status_id' => ActiveStatus::ACTIVE, 'department_id' => 1],
        ]);

        DB::table('cost_centres')->insert([
            ['cost_centre_id' => 1, 'cost_centre_code' => 1001, 'description' => 'Centre 1',
             'department_id' => 1, 'active_status_id' => ActiveStatus::ACTIVE],
        ]);

        DB::table('account_numbers')->insert([
            ['account_number_id' => 1, 'account_number' => 5001, 'description' => 'Office Supplies'],
        ]);

        // app_settings is seeded by migration with mileage_rate=0.5

        // Reset PostgreSQL sequences so controller-created records don't conflict
        $sequences = [
            'active_status' => 'active_status_id',
            'roles' => 'role_id',
            'positions' => 'position_id',
            'departments' => 'department_id',
            'teams' => 'team_id',
            'claim_status' => 'claim_status_id',
            'claim_types' => 'claim_type_id',
            'approval_status' => 'approval_status_id',
            'projects' => 'project_id',
            'cost_centres' => 'cost_centre_id',
            'account_numbers' => 'account_number_id',
        ];

        foreach ($sequences as $table => $column) {
            $max = DB::table($table)->max($column) ?? 0;
            DB::statement("SELECT setval(pg_get_serial_sequence('{$table}', '{$column}'), {$max})");
        }
    }

    protected function createUser(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role_id' => RoleLevel::USER,
            'active_status_id' => ActiveStatus::ACTIVE,
            'position_id' => 1,
            'department_id' => 1,
        ], $overrides));
    }

    protected function createAuthenticatedUser(int $roleId = RoleLevel::SUPER_ADMIN, array $overrides = []): User
    {
        $user = $this->createUser(array_merge(['role_id' => $roleId], $overrides));
        Sanctum::actingAs($user, ['*']);

        return $user;
    }

    protected function attachUserToTeam(User $user, int $teamId): void
    {
        DB::table('team_user')->insert([
            'user_id' => $user->user_id,
            'team_id' => $teamId,
        ]);
    }

    protected function createClaimForUser(User $user, array $overrides = []): Claim
    {
        return Claim::create(array_merge([
            'user_id' => $user->user_id,
            'position_id' => 1,
            'claim_type_id' => ClaimType::REIMBURSEMENT,
            'department_id' => $user->department_id ?? 1,
            'team_id' => 1,
            'claim_status_id' => ClaimStatus::PENDING,
            'claim_submitted' => now()->toDateString(),
            'total_amount' => 100.00,
        ], $overrides));
    }

    protected function createClaimWithExpenses(User $user, int $expenseCount = 1, array $claimOverrides = [], array $expenseOverrides = []): Claim
    {
        $amount = ($expenseOverrides['expense_amount'] ?? 100.00) * $expenseCount;
        $claim = $this->createClaimForUser($user, array_merge(['total_amount' => $amount], $claimOverrides));

        for ($i = 0; $i < $expenseCount; $i++) {
            Expense::create(array_merge([
                'buyer_name' => 'Test Buyer',
                'vendor_name' => 'Test Vendor',
                'expense_amount' => 100.00,
                'transaction_date' => now()->toDateString(),
                'transaction_desc' => 'Test expense',
                'approval_status_id' => ClaimStatus::PENDING,
                'claim_id' => $claim->claim_id,
                'project_id' => 1,
                'cost_centre_id' => 1,
                'account_number_id' => 1,
            ], $expenseOverrides));
        }

        return $claim->load('expenses');
    }

    protected function createClaimWithMileage(User $user, array $claimOverrides = []): array
    {
        $claim = $this->createClaimForUser($user, array_merge(['total_amount' => 25.50], $claimOverrides));

        $expense = Expense::create([
            'buyer_name' => 'Test Buyer',
            'vendor_name' => 'Mileage Vendor',
            'expense_amount' => 25.50,
            'transaction_date' => now()->toDateString(),
            'transaction_desc' => 'Mileage claim',
            'approval_status_id' => ClaimStatus::PENDING,
            'claim_id' => $claim->claim_id,
            'project_id' => 1,
            'cost_centre_id' => 1,
            'account_number_id' => 1,
        ]);

        $mileage = Mileage::create([
            'expense_id' => $expense->expense_id,
            'period_of_from' => now()->startOfMonth()->toDateString(),
            'period_of_to' => now()->endOfMonth()->toDateString(),
        ]);

        $transaction = MileageTransaction::create([
            'mileage_id' => $mileage->mileage_id,
            'transaction_date' => now()->toDateString(),
            'distance_km' => 50.0,
            'meter_km' => 0,
            'parking_amount' => 5.00,
            'mileage_rate' => 0.5,
            'total_amount' => 25.50,
            'buyer' => 'Test Buyer',
            'travel_from' => 'Ottawa',
            'travel_to' => 'Toronto',
        ]);

        return compact('claim', 'expense', 'mileage', 'transaction');
    }
}
