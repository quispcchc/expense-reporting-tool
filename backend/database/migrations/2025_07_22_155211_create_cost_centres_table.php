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
        Schema::create('cost_centres', function (Blueprint $table) {
            $table->id('cost_centre_id');
            $table->integer('cost_centre_code')->unique();
            $table->string('description');
            $table->foreignId('active_status_id')->constrained('active_status', 'active_status_id');
            $table->foreignId('department_id')->constrained('departments', 'department_id');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cost_centres');
    }
};
