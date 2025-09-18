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
            $table->integer('mileage_id')->primary();
            $table->text('period_of_from');
            $table->text('period_of_to');
            $table->text('transaction_date');
            $table->double('distance_km');
            $table->double('meter_km');
            $table->double('parking_amount');
            $table->integer('receipt_id');
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
