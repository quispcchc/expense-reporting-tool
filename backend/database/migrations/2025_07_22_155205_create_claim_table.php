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
        Schema::create('claim', function (Blueprint $table) {
            $table->integer('claim_id')->primary();
            $table->integer('user_id');
            $table->integer('position_id');
            $table->string('claim_notes', 50);
            $table->text('claim_submitted');
            $table->integer('claim_type_id');
            $table->integer('claim_status_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('claim');
    }
};
