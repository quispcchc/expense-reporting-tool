<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Replace claim_id with expense_id in the mileage table.
     *
     * Mileage is conceptually an expense (the expense_amount reflects the mileage
     * total). Linking mileage directly to the expense that owns it makes the
     * data model explicit: claims → expenses → mileage → mileage_transactions.
     */
    public function up(): void
    {
        // Existing mileage rows reference claim_id which is being removed.
        // Deleting them here (cascades to mileage_transactions and mileage_receipts)
        // so the NOT NULL expense_id column can be added cleanly.
        DB::table('mileage')->delete();

        Schema::table('mileage', function (Blueprint $table) {
            $table->dropForeign(['claim_id']);
            $table->dropColumn('claim_id');

            $table->unsignedBigInteger('expense_id')->after('mileage_id');
            $table->foreign('expense_id')
                ->references('expense_id')
                ->on('expenses')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::table('mileage', function (Blueprint $table) {
            $table->dropForeign(['expense_id']);
            $table->dropColumn('expense_id');

            $table->unsignedBigInteger('claim_id')->after('mileage_id');
            $table->foreign('claim_id')
                ->references('claim_id')
                ->on('claims')
                ->onDelete('cascade');
        });
    }
};
