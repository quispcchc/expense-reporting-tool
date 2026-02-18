<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration
{
    public function up():void
    {
        Schema::create('mileage_transaction', function (Blueprint $table) {
            $table->id('transaction_id');

            $table->foreignId('mileage_id')
                ->constrained('mileage', 'mileage_id')
                ->onDelete('cascade');

            $table->date('transaction_date');
            $table->double('distance_km');
            $table->double('meter_km')->nullable();
            $table->decimal('parking_amount', 10, 2)->nullable();
            $table->string('buyer')->nullable();

            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('mileage_transaction');
    }
};