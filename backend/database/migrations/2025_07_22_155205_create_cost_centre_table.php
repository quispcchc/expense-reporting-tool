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
        Schema::create('cost_centre', function (Blueprint $table) {
            $table->integer('cost_centre_id')->nullable()->primary();
            $table->integer('cost_centre_code');
            $table->integer('active_status_id');
            $table->string('cost_centre_account');
            $table->integer('team_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cost_centre');
    }
};
