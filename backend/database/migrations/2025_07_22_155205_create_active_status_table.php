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
        Schema::create('active_status', function (Blueprint $table) {
            // make the id a primary key so foreign key constraints work in sqlite tests
            $table->integer('active_status_id')->primary();
            $table->string('active_status_name', 50);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('active_status');
    }
};
