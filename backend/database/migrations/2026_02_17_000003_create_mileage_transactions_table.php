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
        Schema::create('mileage_transactions', function (Blueprint $table) {
            $table->id('transaction_id');
            $table->foreignId('mileage_id')->constrained('mileage', 'mileage_id')
                ->onUpdate('no action')
                ->onDelete('cascade');
            $table->date('transaction_date');
            $table->double('distance_km')->default(0);
            $table->double('meter_km')->default(0);
            $table->double('parking_amount')->default(0);
            $table->double('mileage_rate')->default(0);
            $table->double('total_amount')->default(0);
            $table->string('buyer', 100)->nullable();
            $table->string('travel_from', 255)->nullable();
            $table->string('travel_to', 255)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mileage_transactions');
    }
};
