<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_users()
    {
        // Seed referenced lookup tables used by factories
    \Illuminate\Support\Facades\DB::table('active_status')->insert([['active_status_id' => 1, 'active_status_name' => 'active']]);
    \Illuminate\Support\Facades\DB::table('role')->insert([['role_id' => 1, 'role_name' => 'admin', 'active_status_id' => 1, 'role_level' => 1 ]]);
    \Illuminate\Support\Facades\DB::table('position')->insert([['position_id' => 1, 'position_name' => 'Member', 'active_status_id' => 1 ]]);
    \Illuminate\Support\Facades\DB::table('team')->insert([['team_id' => 1, 'team_name' => 'Default', 'team_abbreviation' => 'DFT', 'active_status_id' => 1 ]]);

        // Create an admin user and some regular users
        $admin = User::factory()->create([ 'role_id' => 1, 'active_status_id' => 1, 'position_id' => 1, 'team_id' => 1 ]);
        User::factory()->count(3)->create([ 'active_status_id' => 1, 'position_id' => 1, 'team_id' => 1 ]);

    Sanctum::actingAs($admin, ['*']);
    // Disable role middleware to simplify tests (we assert controller behaviour separately)
    $this->withoutMiddleware(\App\Http\Middleware\RoleCheck::class);

    $response = $this->getJson('/api/admin/users');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data',
            'current_page',
            'last_page',
        ]);
    }

    public function test_admin_can_update_user()
    {
    \Illuminate\Support\Facades\DB::table('active_status')->insert([['active_status_id' => 1, 'active_status_name' => 'active']]);
    \Illuminate\Support\Facades\DB::table('role')->insert([['role_id' => 1, 'role_name' => 'admin', 'active_status_id' => 1, 'role_level' => 1 ]]);
    \Illuminate\Support\Facades\DB::table('position')->insert([['position_id' => 1, 'position_name' => 'Member', 'active_status_id' => 1 ]]);
    \Illuminate\Support\Facades\DB::table('team')->insert([['team_id' => 1, 'team_name' => 'Default', 'team_abbreviation' => 'DFT', 'active_status_id' => 1 ]]);

        $admin = User::factory()->create([ 'role_id' => 1, 'active_status_id' => 1, 'position_id' => 1, 'team_id' => 1 ]);
        $user = User::factory()->create([ 'first_name' => 'Old', 'active_status_id' => 1, 'position_id' => 1, 'team_id' => 1 ]);

    Sanctum::actingAs($admin, ['*']);
    $this->withoutMiddleware(\App\Http\Middleware\RoleCheck::class);

    $payload = ['first_name' => 'UpdatedName'];

    $response = $this->putJson("/api/admin/users/{$user->user_id}", $payload);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [ 'user_id' => $user->user_id, 'first_name' => 'UpdatedName' ]);
    }

    public function test_admin_can_delete_user()
    {
    \Illuminate\Support\Facades\DB::table('active_status')->insert([['active_status_id' => 1, 'active_status_name' => 'active']]);
    \Illuminate\Support\Facades\DB::table('role')->insert([['role_id' => 1, 'role_name' => 'admin', 'active_status_id' => 1, 'role_level' => 1 ]]);
    \Illuminate\Support\Facades\DB::table('position')->insert([['position_id' => 1, 'position_name' => 'Member', 'active_status_id' => 1 ]]);
    \Illuminate\Support\Facades\DB::table('team')->insert([['team_id' => 1, 'team_name' => 'Default', 'team_abbreviation' => 'DFT', 'active_status_id' => 1 ]]);

        $admin = User::factory()->create([ 'role_id' => 1, 'active_status_id' => 1, 'position_id' => 1, 'team_id' => 1 ]);
        $user = User::factory()->create([ 'active_status_id' => 1, 'position_id' => 1, 'team_id' => 1 ]);

    Sanctum::actingAs($admin, ['*']);
    $this->withoutMiddleware(\App\Http\Middleware\RoleCheck::class);

    $response = $this->deleteJson("/api/admin/users/{$user->user_id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('users', [ 'user_id' => $user->user_id ]);
    }
}
