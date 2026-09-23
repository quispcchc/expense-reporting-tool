<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add Paid status to approval_statuses if missing
        DB::table('approval_status')->updateOrInsert(
            ['approval_status_id' => 4],
            [
                'approval_status_name' => 'Paid',
                'approval_status_desc' => 'Claim has been paid',
            ]
        );

        // Ensure Paid status is also in claim_statuses (it should be there, but for safety)
        DB::table('claim_status')->updateOrInsert(
            ['claim_status_id' => 4],
            [
                'claim_status_name' => 'Paid',
                'claim_status_desc' => 'Claim has been paid',
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We typically don't delete seed data in down() unless strictly necessary
    }
};
