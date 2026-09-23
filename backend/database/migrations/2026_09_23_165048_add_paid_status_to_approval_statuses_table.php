<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add Paid status to approval_statuses if missing
        \Illuminate\Support\Facades\DB::table('approval_statuses')->updateOrInsert(
            ['approval_status_id' => 4],
            [
                'approval_status_name' => 'Paid',
                'approval_status_desc' => 'Claim has been paid',
            ]
        );

        // Ensure Paid status is also in claim_statuses (it should be there, but for safety)
        \Illuminate\Support\Facades\DB::table('claim_statuses')->updateOrInsert(
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
