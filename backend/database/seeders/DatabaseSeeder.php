<?php

namespace Database\Seeders;

use App\Models\ActiveStatus;
use App\Models\Department;
use App\Models\Position;
use App\Models\Role;
use App\Models\Team;
use App\Models\User;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Database\Factories\ActiveStatusFactory;
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
            'active_status_name' => 'Active'
        ]);

        ActiveStatus::firstOrCreate([
            'active_status_id' => 2,
            'active_status_name' => 'Inactive'
        ]);

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
                    'role_desc' => ucfirst($roleName) . ' role',
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
                'position_id' => fake()->numberBetween(1,10) ,
                'department_id' => fake()->numberBetween(1,5) ,
                'team_id' =>fake()->numberBetween(1,10) ,
            ]);
        }





    }
}
