<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('teams', function (Blueprint $table) {
            $table->bigIncrements('team_id');
            $table->string('team_abbreviation')->unique();
            $table->string('team_name')->unique();
            $table->string('team_desc')->nullable();

            $table->foreignId('active_status_id')
                ->constrained('active_status', 'active_status_id')
                ->onUpdate('cascade')
                ->onDelete('restrict');
            $table->timestamps();

            // Define relationship to departments
            $table->foreignId('department_id')
                ->constrained('departments', 'department_id')
                ->onUpdate('cascade')
                ->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('team');
    }
};
