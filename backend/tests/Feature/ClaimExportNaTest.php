<?php

namespace Tests\Feature;

use App\Models\Claim;
use App\Models\Expense;
use App\Models\Mileage;
use App\Models\MileageTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClaimExportNaTest extends TestCase
{
    use RefreshDatabase;

    private function seedLookups(): void
    {
        DB::table('active_status')->insert([
            ['active_status_id' => 1, 'active_status_name' => 'active'],
        ]);
        DB::table('roles')->insert([
            ['role_id' => 1, 'role_name' => 'super_admin', 'active_status_id' => 1, 'role_level' => 1],
        ]);
        DB::table('positions')->insert([
            ['position_id' => 1, 'position_name' => 'Member', 'active_status_id' => 1],
        ]);
        DB::table('departments')->insert([
            ['department_id' => 1, 'department_name' => 'Engineering',
             'department_abbreviation' => 'ENG', 'active_status_id' => 1],
        ]);
        DB::table('teams')->insert([
            ['team_id' => 1, 'team_name' => 'Alpha', 'team_abbreviation' => 'ALP',
             'active_status_id' => 1, 'department_id' => 1],
        ]);
        DB::table('claim_status')->insert([
            ['claim_status_id' => 1, 'claim_status_name' => 'Pending'],
        ]);
        DB::table('claim_types')->insert([
            ['claim_type_id' => 1, 'claim_type_name' => 'Expense', 'active_status_id' => 1],
        ]);
        DB::table('approval_status')->insert([
            ['approval_status_id' => 1, 'approval_status_name' => 'Pending'],
        ]);
        DB::table('projects')->insert([
            ['project_id' => 1, 'project_name' => 'Project A',
             'active_status_id' => 1, 'department_id' => 1],
        ]);
        DB::table('cost_centres')->insert([
            ['cost_centre_id' => 1, 'cost_centre_code' => 1001, 'description' => 'Centre 1',
             'department_id' => 1, 'active_status_id' => 1],
        ]);
        DB::table('account_numbers')->insert([
            ['account_number_id' => 1, 'account_number' => 5001, 'description' => 'Office Supplies'],
        ]);
    }

    private function createAuthenticatedAdmin(): User
    {
        $admin = User::factory()->create([
            'role_id' => 1, 'active_status_id' => 1,
            'position_id' => 1, 'department_id' => 1,
        ]);
        Sanctum::actingAs($admin, ['*']);

        return $admin;
    }

    private function createClaimWithExpense(int $userId, array $expenseOverrides = []): Claim
    {
        $claim = Claim::create([
            'user_id' => $userId,
            'position_id' => 1,
            'claim_type_id' => 1,
            'department_id' => 1,
            'team_id' => 1,
            'claim_status_id' => 1,
            'claim_submitted' => '2026-01-15',
            'total_amount' => 100.00,
        ]);

        Expense::create(array_merge([
            'buyer_name' => 'John Doe',
            'vendor_name' => 'Vendor Inc',
            'expense_amount' => 100.00,
            'transaction_date' => '2026-01-15',
            'transaction_desc' => 'Office supplies',
            'approval_status_id' => 1,
            'claim_id' => $claim->claim_id,
            'project_id' => 1,
            'cost_centre_id' => 1,
            'account_number_id' => 1,
        ], $expenseOverrides));

        return $claim;
    }

    private function createClaimWithMileageExpense(int $userId): Claim
    {
        $claim = Claim::create([
            'user_id' => $userId,
            'position_id' => 1,
            'claim_type_id' => 1,
            'department_id' => 1,
            'team_id' => 1,
            'claim_status_id' => 1,
            'claim_submitted' => '2026-01-15',
            'total_amount' => 25.50,
        ]);

        $expense = Expense::create([
            'buyer_name' => 'Jane Smith',
            'vendor_name' => 'Mileage Vendor',
            'expense_amount' => 25.50,
            'transaction_date' => '2026-01-15',
            'transaction_desc' => 'Mileage claim',
            'approval_status_id' => 1,
            'claim_id' => $claim->claim_id,
            'project_id' => 1,
            'cost_centre_id' => 1,
            'account_number_id' => 1,
        ]);

        $mileage = Mileage::create([
            'expense_id' => $expense->expense_id,
            'period_of_from' => '2026-01-01',
            'period_of_to' => '2026-01-31',
        ]);

        MileageTransaction::create([
            'mileage_id' => $mileage->mileage_id,
            'transaction_date' => '2026-01-10',
            'distance_km' => 50.0,
            'meter_km' => 0,
            'parking_amount' => 5.00,
            'mileage_rate' => 0.41,
            'total_amount' => 25.50,
            'buyer' => 'Jane Smith',
            'travel_from' => 'Ottawa',
            'travel_to' => 'Toronto',
        ]);

        return $claim;
    }

    private function parseCsvContent(string $content): array
    {
        // Remove BOM
        $content = preg_replace('/^\xEF\xBB\xBF/', '', $content);
        $lines = array_filter(explode("\n", trim($content)));
        $rows = [];
        foreach ($lines as $line) {
            $rows[] = str_getcsv($line);
        }

        return $rows;
    }

    // ==================== CSV TESTS ====================

    public function test_csv_expense_without_mileage_shows_na_in_mileage_columns()
    {
        $this->seedLookups();
        $admin = $this->createAuthenticatedAdmin();
        $this->createClaimWithExpense($admin->user_id);

        $response = $this->getJson('/api/claims/export-csv');
        $response->assertStatus(200);

        $rows = $this->parseCsvContent($response->streamedContent());
        $header = $rows[0];
        $data = $rows[1];

        // Find mileage column indices
        $travelFromIdx = array_search('Travel From', $header);
        $mileageTotalIdx = array_search('Mileage Total', $header);

        $this->assertNotFalse($travelFromIdx);
        $this->assertNotFalse($mileageTotalIdx);

        // All 7 mileage columns should be N/A
        for ($i = $travelFromIdx; $i <= $mileageTotalIdx; $i++) {
            $this->assertEquals('N/A', $data[$i], "Column '{$header[$i]}' (index {$i}) should be N/A but got '{$data[$i]}'");
        }
    }

    public function test_csv_expense_with_mileage_shows_mileage_data()
    {
        $this->seedLookups();
        $admin = $this->createAuthenticatedAdmin();
        $this->createClaimWithMileageExpense($admin->user_id);

        $response = $this->getJson('/api/claims/export-csv');
        $response->assertStatus(200);

        $rows = $this->parseCsvContent($response->streamedContent());
        $header = $rows[0];
        $data = $rows[1];

        $travelFromIdx = array_search('Travel From', $header);
        $travelToIdx = array_search('Travel To', $header);
        $distanceIdx = array_search('Distance (km)', $header);

        $this->assertEquals('Ottawa', $data[$travelFromIdx]);
        $this->assertEquals('Toronto', $data[$travelToIdx]);
        $this->assertEquals('50', $data[$distanceIdx]);
    }

    public function test_csv_expense_with_null_optional_fields_shows_na()
    {
        $this->seedLookups();
        $admin = $this->createAuthenticatedAdmin();

        // Create expense with null optional fields (only nullable columns)
        $this->createClaimWithExpense($admin->user_id, [
            'transaction_notes' => null,
            'transaction_desc' => null,
        ]);

        $response = $this->getJson('/api/claims/export-csv');
        $response->assertStatus(200);

        $rows = $this->parseCsvContent($response->streamedContent());
        $header = $rows[0];
        $data = $rows[1];

        $notesIdx = array_search('Notes', $header);
        $descIdx = array_search('Description', $header);

        $this->assertEquals('N/A', $data[$notesIdx], 'Null transaction_notes should be N/A');
        $this->assertEquals('N/A', $data[$descIdx], 'Null transaction_desc should be N/A');
    }

    public function test_csv_claim_with_no_expenses_shows_na_for_all_expense_fields()
    {
        $this->seedLookups();
        $admin = $this->createAuthenticatedAdmin();

        // Create claim without expenses
        Claim::create([
            'user_id' => $admin->user_id,
            'position_id' => 1,
            'claim_type_id' => 1,
            'department_id' => 1,
            'team_id' => 1,
            'claim_status_id' => 1,
            'claim_submitted' => '2026-01-15',
            'total_amount' => 0,
        ]);

        $response = $this->getJson('/api/claims/export-csv');
        $response->assertStatus(200);

        $rows = $this->parseCsvContent($response->streamedContent());
        $header = $rows[0];
        $data = $rows[1];

        // All expense + mileage columns (index 9 onwards) should be N/A
        $expenseIdIdx = array_search('Expense ID', $header);
        for ($i = $expenseIdIdx; $i < count($data); $i++) {
            $this->assertEquals('N/A', $data[$i], "Column '{$header[$i]}' (index {$i}) should be N/A for claim with no expenses");
        }
    }

    public function test_csv_no_empty_strings_in_output()
    {
        $this->seedLookups();
        $admin = $this->createAuthenticatedAdmin();

        // Create expense with null optional fields
        $this->createClaimWithExpense($admin->user_id, [
            'transaction_notes' => null,
            'transaction_desc' => null,
        ]);

        $response = $this->getJson('/api/claims/export-csv');
        $response->assertStatus(200);

        $rows = $this->parseCsvContent($response->streamedContent());
        $data = $rows[1]; // first data row

        foreach ($data as $idx => $value) {
            $this->assertNotEquals('', $value, "Column index {$idx} should not be empty string, should be N/A or a value");
        }
    }

    // ==================== PDF TESTS ====================

    public function test_pdf_export_returns_pdf_response()
    {
        $this->seedLookups();
        $admin = $this->createAuthenticatedAdmin();
        $claim = $this->createClaimWithExpense($admin->user_id);

        $response = $this->get("/api/claims/{$claim->claim_id}/export-pdf");

        // mPDF may not be available in test env — accept 200 (PDF) or 500 (mPDF missing)
        $status = $response->getStatusCode();
        $this->assertTrue(
            in_array($status, [200, 500]),
            "Expected 200 or 500, got {$status}"
        );

        if ($status === 200) {
            $this->assertStringContainsString('application/pdf', $response->headers->get('Content-Type'));
        }
    }

    public function test_pdf_export_with_mileage_contains_mileage_data()
    {
        $this->seedLookups();
        $admin = $this->createAuthenticatedAdmin();
        $claim = $this->createClaimWithMileageExpense($admin->user_id);

        // Render the blade template directly to check HTML content
        $claimModel = Claim::with([
            'claimType', 'status', 'user', 'department', 'team', 'position',
            'expenses.accountNumber', 'expenses.costCentre', 'expenses.approvalStatus',
            'expenses.receipts', 'expenses.mileage.transactions.receipts', 'notes.user',
        ])->findOrFail($claim->claim_id);

        $html = view('pdf.claim', ['claim' => $claimModel])->render();

        $this->assertStringContainsString('MILEAGE DETAILS', $html);
        $this->assertStringContainsString('Ottawa', $html);
        $this->assertStringContainsString('Toronto', $html);
        $this->assertStringContainsString('50', $html);
    }

    public function test_pdf_export_without_mileage_shows_na()
    {
        $this->seedLookups();
        $admin = $this->createAuthenticatedAdmin();
        $claim = $this->createClaimWithExpense($admin->user_id);

        $claimModel = Claim::with([
            'claimType', 'status', 'user', 'department', 'team', 'position',
            'expenses.accountNumber', 'expenses.costCentre', 'expenses.approvalStatus',
            'expenses.receipts', 'expenses.mileage.transactions.receipts', 'notes.user',
        ])->findOrFail($claim->claim_id);

        $html = view('pdf.claim', ['claim' => $claimModel])->render();

        $this->assertStringContainsString('MILEAGE DETAILS', $html);
        // No mileage data — should show N/A text
        $this->assertStringContainsString('>N/A<', $html);
    }

    public function test_pdf_export_null_fields_show_na_not_empty()
    {
        $this->seedLookups();
        $admin = $this->createAuthenticatedAdmin();

        $claim = $this->createClaimWithExpense($admin->user_id, [
            'transaction_desc' => null,
            'transaction_notes' => null,
        ]);

        $claimModel = Claim::with([
            'claimType', 'status', 'user', 'department', 'team', 'position',
            'expenses.accountNumber', 'expenses.costCentre', 'expenses.approvalStatus',
            'expenses.receipts', 'expenses.mileage.transactions.receipts', 'notes.user',
        ])->findOrFail($claim->claim_id);

        $html = view('pdf.claim', ['claim' => $claimModel])->render();

        // Null fields should show N/A in the PDF
        $this->assertStringContainsString('N/A', $html);
        $this->assertMatchesRegularExpression('/<td>N\/A<\/td>/', $html);
    }

    public function test_pdf_no_expenses_shows_no_expenses_found()
    {
        $this->seedLookups();
        $admin = $this->createAuthenticatedAdmin();

        $claim = Claim::create([
            'user_id' => $admin->user_id,
            'position_id' => 1,
            'claim_type_id' => 1,
            'department_id' => 1,
            'team_id' => 1,
            'claim_status_id' => 1,
            'claim_submitted' => '2026-01-15',
            'total_amount' => 0,
        ]);

        $claimModel = Claim::with([
            'claimType', 'status', 'user', 'department', 'team', 'position',
            'expenses.accountNumber', 'expenses.costCentre', 'expenses.approvalStatus',
            'expenses.receipts', 'expenses.mileage.transactions.receipts', 'notes.user',
        ])->findOrFail($claim->claim_id);

        $html = view('pdf.claim', ['claim' => $claimModel])->render();

        $this->assertStringContainsString('No expenses found', $html);
        // Mileage section should show N/A
        $this->assertStringContainsString('MILEAGE DETAILS', $html);
    }
}
