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
        Schema::table('claim_approval', function (Blueprint $table) {
            $table->foreign(['approval_status_id'], null)->references(['approval_status_id'])->on('approval_status')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['approved_by'], null)->references(['user_id'])->on('users')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['claim_id'], null)->references([''])->on('claim')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('claim_approval', function (Blueprint $table) {
            $table->dropForeign();
            $table->dropForeign();
            $table->dropForeign();
        });
    }
};
