<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add travel_from and travel_to to mileage_transactions
        Schema::table('mileage_transactions', function (Blueprint $table) {
            $table->string('travel_from', 255)->nullable()->after('buyer');
            $table->string('travel_to', 255)->nullable()->after('travel_from');
        });

        // Copy existing data from mileage header to each transaction
        DB::statement('
            UPDATE mileage_transactions mt
            JOIN mileage m ON mt.mileage_id = m.mileage_id
            SET mt.travel_from = m.travel_from,
                mt.travel_to   = m.travel_to
        ');

        // Remove columns from mileage table
        Schema::table('mileage', function (Blueprint $table) {
            $table->dropColumn(['travel_from', 'travel_to']);
        });
    }

    public function down(): void
    {
        Schema::table('mileage', function (Blueprint $table) {
            $table->string('travel_from', 255)->nullable()->after('expense_id');
            $table->string('travel_to', 255)->nullable()->after('travel_from');
        });

        DB::statement('
            UPDATE mileage m
            JOIN (
                SELECT mileage_id, travel_from, travel_to
                FROM mileage_transactions
                GROUP BY mileage_id
            ) mt ON m.mileage_id = mt.mileage_id
            SET m.travel_from = mt.travel_from,
                m.travel_to   = mt.travel_to
        ');

        Schema::table('mileage_transactions', function (Blueprint $table) {
            $table->dropColumn(['travel_from', 'travel_to']);
        });
    }
};
