<?php

namespace Database\Seeders;

use App\Models\AccountNumber;
use App\Models\ActiveStatus;
use App\Models\ApprovalStatus;
use App\Models\ClaimStatus;
use App\Models\ClaimType;
use App\Models\CostCentre;
use App\Models\Department;
use App\Models\Position;
use App\Models\Project;
use App\Models\Role;
use App\Models\Team;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {

        // Active Status
        ActiveStatus::firstOrCreate([
            'active_status_id' => 1,
            'active_status_name' => 'Active',
        ]);

        ActiveStatus::firstOrCreate([
            'active_status_id' => 2,
            'active_status_name' => 'Inactive',
        ]);

        // Approval Status
        $approvalStatuses = [
            ['approval_status_id' => 1, 'approval_status_name' => 'Pending', 'approval_status_desc' => 'Awaiting approval'],
            ['approval_status_id' => 2, 'approval_status_name' => 'Approved', 'approval_status_desc' => 'Approved by manager'],
            ['approval_status_id' => 3, 'approval_status_name' => 'Rejected', 'approval_status_desc' => 'Rejected by manager'],
        ];

        foreach ($approvalStatuses as $status) {
            ApprovalStatus::firstOrCreate(
                ['approval_status_id' => $status['approval_status_id']],
                [
                    'approval_status_name' => $status['approval_status_name'],
                    'approval_status_desc' => $status['approval_status_desc'],
                ]
            );
        }

        // Roles
        $roles = [
            'regular_user' => 4,
            'approver' => 3,
            'admin' => 2,
            'super_admin' => 1,
        ];

        foreach ($roles as $roleName => $roleLevel) {
            Role::firstOrCreate(
                ['role_name' => $roleName],
                [
                    'role_level' => $roleLevel,
                    'role_desc' => ucfirst($roleName).' role',
                    'active_status_id' => 1,
                ]
            );
        }

        Position::factory(10)->create();

        // Department
        $departments = [
            ['department_name' => 'Assertive Community Treatment Team', 'department_abbreviation' => 'ACTT'],
            ['department_name' => 'Corporate Services', 'department_abbreviation' => 'CS'],
            ['department_name' => 'Community Health and Vitality', 'department_abbreviation' => 'CHV'],
            ['department_name' => 'Healthy Growth and Development', 'department_abbreviation' => 'HGD'],
            ['department_name' => 'Health and Support Services', 'department_abbreviation' => 'HIS'],
        ];

        foreach ($departments as $dept) {
            Department::create($dept);
        }

        // Team
        Team::factory(10)->create();

        // User
        //        User::factory(10)->create();

        $users = [
            ['Super', 'Admin', 'superadmin@example.com', 4],
            ['System', 'Admin', 'admin@example.com', 3],
            ['Project', 'Approver', 'approver@example.com', 2],
            ['Test', 'User', 'test@example.com', 1],
        ];

        foreach ($users as [$first, $last, $email, $role]) {
            User::factory()->create([
                'first_name' => $first,
                'last_name' => $last,
                'email' => $email,
                'email_verified_at' => now(),
                'user_pass' => Hash::make('password'),
                'active_status_id' => 1,
                'role_id' => $role,
                'position_id' => fake()->numberBetween(1, 10),
                'department_id' => fake()->numberBetween(1, 5),
                'team_id' => fake()->numberBetween(1, 10),
            ]);
        }

        // Projects
        Project::create([
            'active_status_id' => 1,
            'project_name' => 'Project Test',
            'project_desc' => 'this is a project',
            'department_id' => 1,
        ]);

        // Claim Types
        $claimTypes = [
            ['claim_type_id' => 1, 'claim_type_name' => 'Expense', 'claim_type_desc' => 'General expense claims'],
            ['claim_type_id' => 2, 'claim_type_name' => 'Mileage', 'claim_type_desc' => 'Travel and mileage claims'],
            ['claim_type_id' => 3, 'claim_type_name' => 'Per Diem', 'claim_type_desc' => 'Daily allowance claims'],
            ['claim_type_id' => 4, 'claim_type_name' => 'Travel', 'claim_type_desc' => 'Travel-related expense claims'],
        ];

        foreach ($claimTypes as $type) {
            ClaimType::firstOrCreate(
                ['claim_type_id' => $type['claim_type_id']],
                [
                    'claim_type_name' => $type['claim_type_name'],
                    'claim_type_desc' => $type['claim_type_desc'],
                    'active_status_id' => 1,
                ]
            );
        }

        // Claim Status
        $claimStatuses = [
            ['claim_status_id' => 1, 'claim_status_name' => 'Pending', 'claim_status_desc' => 'Claim submitted and awaiting review'],
            ['claim_status_id' => 2, 'claim_status_name' => 'Approved', 'claim_status_desc' => 'Claim has been approved'],
            ['claim_status_id' => 3, 'claim_status_name' => 'Rejected', 'claim_status_desc' => 'Claim has been rejected'],
            ['claim_status_id' => 4, 'claim_status_name' => 'Paid', 'claim_status_desc' => 'Claim has been paid'],
            ['claim_status_id' => 5, 'claim_status_name' => 'Draft', 'claim_status_desc' => 'Claim is in draft status'],
        ];

        foreach ($claimStatuses as $status) {
            ClaimStatus::firstOrCreate(
                ['claim_status_id' => $status['claim_status_id']],
                [
                    'claim_status_name' => $status['claim_status_name'],
                    'claim_status_desc' => $status['claim_status_desc'],
                ]
            );
        }

        // Cost Centres
        $costCentres = [
            ['cost_centre_code' => '1000', 'description' => 'Administration', 'department_id' => 2, 'active_status_id' => 1],
            ['cost_centre_code' => '2000', 'description' => 'ACTT Program', 'department_id' => 1, 'active_status_id' => 1],
            ['cost_centre_code' => '3000', 'description' => 'Community Health Programs', 'department_id' => 3, 'active_status_id' => 1],
            ['cost_centre_code' => '4000', 'description' => 'Child Development Services', 'department_id' => 4, 'active_status_id' => 1],
            ['cost_centre_code' => '5000', 'description' => 'Support Services', 'department_id' => 5, 'active_status_id' => 1],
            ['cost_centre_code' => '1100', 'description' => 'Human Resources', 'department_id' => 2, 'active_status_id' => 1],
            ['cost_centre_code' => '1200', 'description' => 'Finance', 'department_id' => 2, 'active_status_id' => 1],
            ['cost_centre_code' => '2100', 'description' => 'Mental Health Services', 'department_id' => 1, 'active_status_id' => 1],
        ];

        foreach ($costCentres as $cc) {
            CostCentre::firstOrCreate(
                ['cost_centre_code' => $cc['cost_centre_code']],
                [
                    'description' => $cc['description'],
                    'department_id' => $cc['department_id'],
                    'active_status_id' => $cc['active_status_id'],
                ]
            );
        }

        // Account Numbers
        $accountNumbers = [
            ['account_number' => '6100', 'description' => 'Office Supplies'],
            ['account_number' => '6200', 'description' => 'Travel & Accommodation'],
            ['account_number' => '6300', 'description' => 'Meals & Entertainment'],
            ['account_number' => '6400', 'description' => 'Mileage'],
            ['account_number' => '6500', 'description' => 'Professional Development'],
            ['account_number' => '6600', 'description' => 'Equipment & Tools'],
            ['account_number' => '6700', 'description' => 'Communications'],
            ['account_number' => '6800', 'description' => 'Miscellaneous'],
        ];

        foreach ($accountNumbers as $acc) {
            AccountNumber::firstOrCreate(
                ['account_number' => $acc['account_number']],
                ['description' => $acc['description']]
            );
        }

    }
}
