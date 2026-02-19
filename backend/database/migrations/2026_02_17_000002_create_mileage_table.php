<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Mileage is conceptually an expense (the expense_amount reflects the mileage
     * total). Linking mileage directly to the expense that owns it makes the
     * data model explicit: claims → expenses → mileage → mileage_transactions.
     */
    public function up(): void
    {
        Schema::create('mileage', function (Blueprint $table) {
            $table->id('mileage_id');
            $table->unsignedBigInteger('expense_id');
            $table->foreign('expense_id')
                ->references('expense_id')
                ->on('expenses')
                ->onDelete('cascade');
            $table->string('travel_from', 255)->nullable();
            $table->string('travel_to', 255)->nullable();
            $table->date('period_of_from')->nullable();
            $table->date('period_of_to')->nullable();
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
