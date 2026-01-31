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
        Schema::create('claim_approval', function (Blueprint $table) {
            // same issue
            $table->id('claim_approval_id');
            $table->integer('claim_id');
            $table->string('claim_approval_details', 500);
            $table->integer('approval_status_id');
            $table->integer('approved_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('claim_approval');
    }
};
