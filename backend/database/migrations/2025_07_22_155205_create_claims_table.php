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
        Schema::create('claims', function (Blueprint $table) {
            $table->id('claim_id');
            $table->date('claim_submitted');
            $table->double('total_amount');

            $table->foreignId('claim_status_id')->constrained('claim_status', 'claim_status_id');
            $table->foreignId('user_id')->constrained('users', 'user_id');
            $table->foreignId('position_id')->constrained('positions', 'position_id');
            $table->foreignId('claim_type_id')->constrained('claim_types', 'claim_type_id');
            $table->foreignId('department_id')->constrained('departments', 'department_id');
            $table->foreignId('team_id')->constrained('teams', 'team_id');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('PRAGMA foreign_keys = OFF;');
        Schema::dropIfExists('claims');
    }
};
