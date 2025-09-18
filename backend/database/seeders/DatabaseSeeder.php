<?php

namespace Database\Seeders;

use App\Models\ActiveStatus;
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

        // --- 1. Active Status ---
        ActiveStatus::firstOrCreate([
            'active_status_id' => 1,
            'active_status_name' => 'Active'
        ]);

        ActiveStatus::firstOrCreate([
            'active_status_id' => 2,
            'active_status_name' => 'Inactive'
        ]);

        // --- 2. Roles ---
        $roles = [
            'regular user' => 1,
            'approver' => 2,
            'admin' => 3,
            'super admin' => 4,
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
        Team::factory(10)->create();

        User::factory(10)->create();

//        User::factory()->create([
//            'name' => 'Test User',
//            'email' => 'test@example.com',
//        ]);
    }
}
