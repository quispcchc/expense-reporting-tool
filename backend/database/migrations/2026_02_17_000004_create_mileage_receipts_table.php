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
        Schema::create('mileage_receipts', function (Blueprint $table) {
            $table->id('receipt_id');
            $table->foreignId('transaction_id')->constrained('mileage_transactions', 'transaction_id')
                ->onUpdate('no action')
                ->onDelete('cascade');
            $table->string('file_name', 255);
            $table->string('file_type', 50)->nullable();
            $table->string('file_path', 500);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mileage_receipts');
    }
};
