<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Position;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database for development.
     * This seeder calls ProductionSeeder first for base data,
     * then adds development-specific test users.
     *
     * Run with: php artisan db:seed
     */
    public function run(): void
    {
        // First, run ProductionSeeder to create all base lookup data
        $this->call(ProductionSeeder::class);

        // Then, add development-specific test users
        $this->seedDevelopmentUsers();
    }

    /**
     * Create development test users with @example.com emails.
     */
    private function seedDevelopmentUsers(): void
    {
        $superAdminRole = Role::where('role_name', 'super_admin')->first();
        $adminRole = Role::where('role_name', 'admin')->first();
        $approverRole = Role::where('role_name', 'approver')->first();
        $userRole = Role::where('role_name', 'regular_user')->first();

        $positionId = Position::first()?->position_id ?? 1;
        $departmentId = Department::first()?->department_id ?? 1;

        $devUsers = [
            [
                'email' => 'superadmin@example.com',
                'first_name' => 'Dev',
                'last_name' => 'SuperAdmin',
                'role_id' => $superAdminRole?->role_id ?? 1,
            ],
            [
                'email' => 'admin@example.com',
                'first_name' => 'Dev',
                'last_name' => 'Admin',
                'role_id' => $adminRole?->role_id ?? 2,
            ],
            [
                'email' => 'approver@example.com',
                'first_name' => 'Dev',
                'last_name' => 'Approver',
                'role_id' => $approverRole?->role_id ?? 3,
            ],
            [
                'email' => 'test@example.com',
                'first_name' => 'Test',
                'last_name' => 'User',
                'role_id' => $userRole?->role_id ?? 4,
            ],
        ];

        foreach ($devUsers as $userData) {
            User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'first_name' => $userData['first_name'],
                    'last_name' => $userData['last_name'],
                    'email_verified_at' => now(),
                    'user_pass' => Hash::make('password'),
                    'active_status_id' => 1,
                    'role_id' => $userData['role_id'],
                    'position_id' => $positionId,
                    'department_id' => $departmentId,
                ]
            );
        }
    }
}
