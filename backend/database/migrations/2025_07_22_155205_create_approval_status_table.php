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
        Schema::create('approval_status', function (Blueprint $table) {
            //same here too, using "primary()" and "unique" make a conflict
            $table->integer('approval_status_id')->primary();
            $table->string('approval_status_name', 50);
            $table->string('approval_status_desc')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_status');
    }
};
