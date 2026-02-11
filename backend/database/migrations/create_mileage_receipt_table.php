<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up():void
    {
        Schema::create('mileage_receipt', function (Blueprint $table) {
            $table->id('receipt_id');

            $table->foreignId('transaction_id')
                ->constrained('mileage_transaction', 'transaction_id')
                ->onDelete('cascade');

            $table->string('file_name');
            $table->string('file_type');
            $table->string('file_path');

            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('mileage_receipt');
    }
};