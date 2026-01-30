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
        Schema::create('expenses', function (Blueprint $table) {
            $table->id('expense_id');
            $table->string('buyer_name', 50);
            $table->string('vendor_name', 50);
            $table->double('expense_amount');
            $table->date('transaction_date');
            $table->text('transaction_desc')->nullable();
            $table->text('transaction_notes')->nullable();

            $table->foreignId('approval_status_id')->constrained('approval_status', 'approval_status_id')
                ->onUpdate('no action')
                ->onDelete('no action');

            $table->foreignId('claim_id')->constrained('claims', 'claim_id')
                ->onUpdate('no action')
                ->onDelete('no action');

            $table->foreignId('project_id')->constrained('projects', 'project_id')
                ->onUpdate('no action')
                ->onDelete('no action');

            $table->foreignId('cost_centre_id')->constrained('cost_centres', 'cost_centre_id')
                ->onUpdate('no action')
                ->onDelete('no action');

            $table->foreignId('account_number_id')->constrained('account_numbers', 'account_number_id')
                ->onUpdate('no action')
                ->onDelete('no action');

            //            $table->integer('approval_status_id');
            //            $table->integer('claim_id');
            //            $table->integer('project_id');
            //            $table->integer('cost_centre_id');
            //            $table->integer('account_number_id');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
