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
        // User        

        $users = [
            ['Super', 'Admin', 'superadmin@example.com', 4],
            ['System', 'Admin', 'admin@example.com', 3],
            ['Project', 'Approver', 'approver@example.com', 2],
            ['Test', 'User', 'test@example.com', 1],
        ];

        foreach ($users as [$first, $last, $email, $role]) {
            $positionId = Position::inRandomOrder()->value('position_id');
            $departmentId = Department::inRandomOrder()->value('department_id');
            
            User::factory()->create([
                'first_name' => $first,
                'last_name' => $last,
                'email' => $email,
                'email_verified_at' => now(),
                'user_pass' => Hash::make('password'),
                'active_status_id' => 1,
                'role_id' => $role,
                'position_id' => $positionId,
                'department_id' => $departmentId,
            ]);
        }


    }
}
