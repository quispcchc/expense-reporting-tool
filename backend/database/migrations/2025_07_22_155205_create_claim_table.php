<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
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
            $table->integer('claim_type_id');
            $table->integer('department_id');
            $table->string('claim_notes', 50);
            $table->text('claim_submitted'); // claim submitted date?
            $table->decimal('total_amount',10,2);


            $table->integer('claim_status_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('PRAGMA foreign_keys = OFF;');
        Schema::dropIfExists('claim');
    }
};
