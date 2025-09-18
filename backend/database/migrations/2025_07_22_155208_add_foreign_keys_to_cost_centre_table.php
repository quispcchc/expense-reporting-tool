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
        Schema::table('cost_centre', function (Blueprint $table) {
            $table->foreign(['active_status_id'], null)->references(['active_status_id'])->on('active_status')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cost_centre', function (Blueprint $table) {
            $table->dropForeign();
        });
    }
};
