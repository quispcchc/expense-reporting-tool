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
        Schema::table('expense', function (Blueprint $table) {
            $table->foreign(['tag_id'], null)->references(['tag_id'])->on('tag')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['approval_status_id'], null)->references(['approval_status_id'])->on('approval_status')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['mileage_id'], null)->references(['mileage_id'])->on('mileage')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['claim_id'], null)->references(['claim_id'])->on('claim')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['project_id'], null)->references(['project_id'])->on('project')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['receipt_id'], null)->references(['receipt_id'])->on('receipt')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['team_id'], null)->references(['team_id'])->on('team')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expense', function (Blueprint $table) {
            $table->dropForeign();
            $table->dropForeign();
            $table->dropForeign();
            $table->dropForeign();
            $table->dropForeign();
            $table->dropForeign();
            $table->dropForeign();
        });
    }
};
