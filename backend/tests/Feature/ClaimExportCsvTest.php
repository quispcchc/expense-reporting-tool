<?php

namespace Tests\Feature;

use App\Models\Claim;
use App\Models\Expense;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClaimExportCsvTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Seed lookup tables required by foreign key constraints.
     */
    private function seedLookups(): void
    {
        DB::table('active_status')->insert([
            ['active_status_id' => 1, 'active_status_name' => 'active'],
        ]);
        DB::table('role')->insert([
            ['role_id' => 1, 'role_name' => 'super_admin', 'active_status_id' => 1, 'role_level' => 1],
        ]);
        DB::table('position')->insert([
            ['position_id' => 1, 'position_name' => 'Member', 'active_status_id' => 1],
        ]);
        DB::table('department')->insert([
            ['department_id' => 1, 'department_name' => 'Engineering', 'active_status_id' => 1],
            ['department_id' => 2, 'department_name' => 'Marketing', 'active_status_id' => 1],
        ]);
        DB::table('team')->insert([
            ['team_id' => 1, 'team_name' => 'Alpha', 'team_abbreviation' => 'ALP', 'active_status_id' => 1],
        ]);
        DB::table('claim_status')->insert([
            ['claim_status_id' => 1, 'claim_status_name' => 'Pending'],
            ['claim_status_id' => 2, 'claim_status_name' => 'Approved'],
        ]);
        DB::table('claim_types')->insert([
            ['claim_type_id' => 1, 'claim_type_name' => 'Expense', 'active_status_id' => 1],
        ]);
        DB::table('approval_status')->insert([
            ['approval_status_id' => 1, 'approval_status_name' => 'Pending'],
        ]);
        DB::table('projects')->insert([
            ['project_id' => 1, 'project_name' => 'Project A', 'active_status_id' => 1],
        ]);
        DB::table('cost_centres')->insert([
            ['cost_centre_id' => 1, 'cost_centre_code' => 'CC001', 'cost_centre_name' => 'Centre 1',
             'department_id' => 1, 'active_status_id' => 1],
        ]);
        DB::table('account_numbers')->insert([
            ['account_number_id' => 1, 'account_number_code' => 'ACC001',
             'account_number_name' => 'Account 1', 'active_status_id' => 1],
        ]);
    }

    /**
     * Create a claim with an expense for testing.
     */
    private function createClaimWithExpense(array $claimOverrides = []): Claim
    {
        $defaults = [
            'user_id'        => 1,
            'position_id'    => 1,
            'claim_type_id'  => 1,
            'department_id'  => 1,
            'team_id'        => 1,
            'claim_status_id' => 1,
            'claim_submitted' => '2026-01-15',
            'total_amount'   => 100.00,
        ];

        $claim = Claim::create(array_merge($defaults, $claimOverrides));

        Expense::create([
            'buyer_name'        => 'John Doe',
            'vendor_name'       => 'Vendor Inc',
            'expense_amount'    => 100.00,
            'transaction_date'  => '2026-01-15',
            'transaction_desc'  => 'Office supplies',
            'approval_status_id' => 1,
            'claim_id'          => $claim->claim_id,
            'project_id'        => 1,
            'cost_centre_id'    => 1,
            'account_number_id' => 1,
        ]);

        return $claim;
    }

    public function test_export_csv_returns_200_with_csv_content_type()
    {
        $this->seedLookups();
        $admin = User::factory()->create([
            'role_id' => 1, 'active_status_id' => 1,
            'position_id' => 1, 'team_id' => 1, 'department_id' => 1,
        ]);

        $this->createClaimWithExpense(['user_id' => $admin->user_id]);

        Sanctum::actingAs($admin, ['*']);

        $response = $this->getJson('/api/claims/export-csv');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('attachment', $response->headers->get('Content-Disposition'));

        // Verify CSV header row exists
        $content = $response->streamedContent();
        $this->assertStringContainsString('Claim ID', $content);
        $this->assertStringContainsString('Office supplies', $content);
    }

    public function test_export_csv_filters_by_date_range()
    {
        $this->seedLookups();
        $admin = User::factory()->create([
            'role_id' => 1, 'active_status_id' => 1,
            'position_id' => 1, 'team_id' => 1, 'department_id' => 1,
        ]);

        // Claim inside range
        $this->createClaimWithExpense([
            'user_id' => $admin->user_id,
            'claim_submitted' => '2026-01-15',
        ]);

        // Claim outside range
        $this->createClaimWithExpense([
            'user_id' => $admin->user_id,
            'claim_submitted' => '2025-06-01',
        ]);

        Sanctum::actingAs($admin, ['*']);

        $response = $this->getJson('/api/claims/export-csv?date_from=2026-01-01&date_to=2026-01-31');

        $response->assertStatus(200);
        $content = $response->streamedContent();

        // Should contain claim from January 2026
        $this->assertStringContainsString('2026-01-15', $content);

        // Count data rows (excluding header) — should be exactly 1 expense row
        $lines = array_filter(explode("\n", trim($content)));
        // First line is BOM + header, then 1 data row
        $this->assertCount(2, $lines);
    }

    public function test_export_csv_filters_by_claim_status()
    {
        $this->seedLookups();
        $admin = User::factory()->create([
            'role_id' => 1, 'active_status_id' => 1,
            'position_id' => 1, 'team_id' => 1, 'department_id' => 1,
        ]);

        // Pending claim
        $this->createClaimWithExpense([
            'user_id' => $admin->user_id,
            'claim_status_id' => 1,
        ]);

        // Approved claim
        $this->createClaimWithExpense([
            'user_id' => $admin->user_id,
            'claim_status_id' => 2,
        ]);

        Sanctum::actingAs($admin, ['*']);

        $response = $this->getJson('/api/claims/export-csv?claim_status_id=2');

        $response->assertStatus(200);
        $content = $response->streamedContent();

        // Should contain Approved, not Pending (in status column)
        $this->assertStringContainsString('Approved', $content);
        // Only 1 data row + header
        $lines = array_filter(explode("\n", trim($content)));
        $this->assertCount(2, $lines);
    }

    public function test_export_csv_requires_authentication()
    {
        $response = $this->getJson('/api/claims/export-csv');

        $response->assertStatus(401);
    }
}
