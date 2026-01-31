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
        Schema::table("departments", function (Blueprint $table) {
            $table->index("active_status_id");
        });

        Schema::table("teams", function (Blueprint $table) {
            $table->index("department_id");
            $table->index("active_status_id");
        });

        Schema::table("cost_centres", function (Blueprint $table) {
            $table->index("department_id");
            $table->index("active_status_id");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table("departments", function (Blueprint $table) {
            $table->dropIndex(["active_status_id"]);
        });

        Schema::table("teams", function (Blueprint $table) {
            $table->dropIndex(["department_id"]);
            $table->dropIndex(["active_status_id"]);
        });

        Schema::table("cost_centres", function (Blueprint $table) {
            $table->dropIndex(["department_id"]);
            $table->dropIndex(["active_status_id"]);
        });
    }
};
