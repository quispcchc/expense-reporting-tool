<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_settings', function (Blueprint $table) {
            $table->id('setting_id');
            $table->string('key')->unique();
            $table->string('value');
            $table->timestamps();
        });

        // Seed default mileage rate
        DB::table('app_settings')->insert([
            'key' => 'mileage_rate',
            'value' => '0.5',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('app_settings');
    }
};
