<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class LookupControllerTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    public function test_get_lookups_returns_all_data(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser();

        $response = $this->getJson('/api/lookups');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'roles',
                'teams',
                'activeStatuses',
                'positions',
                'departments',
                'costCentres',
                'projects',
                'accountNums',
                'claimTypes',
                'claimStatus',
                'tags',
            ],
        ]);
    }

    public function test_lookups_require_authentication(): void
    {
        $response = $this->getJson('/api/lookups');

        $response->assertStatus(401);
    }

    public function test_lookups_contain_seeded_data(): void
    {
        $this->seedLookups();
        $this->createAuthenticatedUser();

        $response = $this->getJson('/api/lookups');

        $response->assertStatus(200);

        $data = $response->json('data');

        $roleNames = collect($data['roles'])->pluck('role_name')->toArray();
        $this->assertContains('super_admin', $roleNames);

        $departmentNames = collect($data['departments'])->pluck('department_name')->toArray();
        $this->assertContains('Engineering', $departmentNames);
    }
}
