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
        Schema::table('users', function (Blueprint $table) {
            $table->foreign(['department_id'], null)->references(['department_id'])->on('departments')->onUpdate('cascade')->onDelete('cascade');
            $table->foreign(['team_id'], null)->references(['team_id'])->on('teams')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['active_status_id'], null)->references(['active_status_id'])->on('active_status')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['position_id'], null)->references(['position_id'])->on('positions')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign();
            $table->dropForeign();
            $table->dropForeign();
        });
    }
};
