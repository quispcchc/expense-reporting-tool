<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1️ Add columns to mileage_transactions
        Schema::table('mileage_transactions', function (Blueprint $table) {
            $table->string('travel_from', 255)->nullable();
            $table->string('travel_to', 255)->nullable();
        });

        // 2️ Copy data from mileage → mileage_transactions
        DB::statement('
            UPDATE mileage_transactions mt
            SET travel_from = m.travel_from,
                travel_to   = m.travel_to
            FROM mileage m
            WHERE mt.mileage_id = m.mileage_id
        ');

        // 3️ Drop columns from mileage
        Schema::table('mileage', function (Blueprint $table) {
            $table->dropColumn(['travel_from', 'travel_to']);
        });
    }

    public function down(): void
    {
        // 1️ Add columns back to mileage
        Schema::table('mileage', function (Blueprint $table) {
            $table->string('travel_from', 255)->nullable();
            $table->string('travel_to', 255)->nullable();
        });

        // 2️ Copy data back (Postgres-safe way)
        DB::statement('
            UPDATE mileage m
            SET travel_from = mt.travel_from,
                travel_to   = mt.travel_to
            FROM (
                SELECT DISTINCT ON (mileage_id)
                    mileage_id,
                    travel_from,
                    travel_to
                FROM mileage_transactions
                ORDER BY mileage_id
            ) mt
            WHERE m.mileage_id = mt.mileage_id
        ');

        // 3️ Drop columns from mileage_transactions
        Schema::table('mileage_transactions', function (Blueprint $table) {
            $table->dropColumn(['travel_from', 'travel_to']);
        });
    }
};
