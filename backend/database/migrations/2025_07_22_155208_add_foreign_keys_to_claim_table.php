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
        Schema::table('claim', function (Blueprint $table) {
            $table->foreign(['claim_type_id'], null)->references(['claim_type_id'])->on('claim_type')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['position_id'], null)->references(['position_id'])->on('position')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['user_id'], null)->references(['user_id'])->on('users')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('claim', function (Blueprint $table) {
            $table->dropForeign();
            $table->dropForeign();
            $table->dropForeign();
        });
    }
};
