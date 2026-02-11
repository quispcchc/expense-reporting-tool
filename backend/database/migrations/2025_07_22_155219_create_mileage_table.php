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
        Schema::create('mileage', function (Blueprint $table) {
            $table->id('mileage_id');

            $table->foreignId('claim_id')
                ->constrained('claims', 'claim_id')
                ->onDelete('cascade')
                ->unique();
            $table->string('travel_from', 255);
            $table->string('travel_to', 255);
            $table->date('period_of_from');
            $table->date('period_of_to');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mileage');
    }
};
