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
        Schema::create('expense', function (Blueprint $table) {
            $table->integer('expense_id')->primary();
            $table->string('buyer_name', 50);
            $table->string('vendor_name', 50);
            $table->text('transaction_date');
            $table->string('transaction_desc');
            $table->double('expense_amount');
            $table->integer('receipt_id');
            $table->integer('tag_id');
            $table->integer('approval_status_id');
            $table->integer('claim_id');
//            $table->integer('mileage_id');
            $table->integer('team_id');
            $table->integer('project_id');
            $table->integer('cost_centre_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expense');
    }
};
