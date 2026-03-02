<?php

namespace Tests\Feature;

use App\Enums\ClaimStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\SeedsLookups;

class ClaimExportCsvTest extends TestCase
{
    use RefreshDatabase, SeedsLookups;

    public function test_export_csv_returns_200_with_csv_content_type()
    {
        $this->seedLookups();
        $admin = $this->createAuthenticatedUser();
        $this->createClaimWithExpenses($admin, 1, ['claim_submitted' => '2026-01-15'], [
            'buyer_name' => 'John Doe',
            'vendor_name' => 'Vendor Inc',
            'transaction_desc' => 'Office supplies',
        ]);

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
        $admin = $this->createAuthenticatedUser();

        // Claim inside range
        $this->createClaimWithExpenses($admin, 1, ['claim_submitted' => '2026-01-15']);

        // Claim outside range
        $this->createClaimWithExpenses($admin, 1, ['claim_submitted' => '2025-06-01']);

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
        $admin = $this->createAuthenticatedUser();

        // Pending claim
        $this->createClaimWithExpenses($admin, 1, ['claim_status_id' => ClaimStatus::PENDING]);

        // Approved claim
        $this->createClaimWithExpenses($admin, 1, ['claim_status_id' => ClaimStatus::APPROVED]);

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
