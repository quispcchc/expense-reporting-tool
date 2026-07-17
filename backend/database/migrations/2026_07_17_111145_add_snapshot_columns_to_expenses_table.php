<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            // Add snapshot columns for historical data integrity if they don't exist
            if (!Schema::hasColumn('expenses', 'cost_centre_code_snapshot')) {
                $table->string('cost_centre_code_snapshot')->nullable()->after('cost_centre_id');
            }
            if (!Schema::hasColumn('expenses', 'cost_centre_description_snapshot')) {
                $table->string('cost_centre_description_snapshot')->nullable()->after('cost_centre_code_snapshot');
            }
            if (!Schema::hasColumn('expenses', 'account_number_snapshot')) {
                $table->string('account_number_snapshot')->nullable()->after('account_number_id');
            }
            if (!Schema::hasColumn('expenses', 'project_name_snapshot')) {
                $table->string('project_name_snapshot')->nullable()->after('project_id');
            }

            // Update foreign keys to 'set null' on delete
            // Note: We use raw SQL or check if foreign keys exist if we want to be extremely safe,
            // but usually in a failed migration that rolls back, these would be reverted.
            try {
                $table->dropForeign(['cost_centre_id']);
                $table->dropForeign(['account_number_id']);
                $table->dropForeign(['project_id']);
            } catch (\Exception $e) {
                // Ignore if foreign keys were already dropped
            }

            $table->foreignId('cost_centre_id')->nullable()->change()->constrained('cost_centres', 'cost_centre_id')->onDelete('set null');
            $table->foreignId('account_number_id')->nullable()->change()->constrained('account_numbers', 'account_number_id')->onDelete('set null');
            $table->foreignId('project_id')->nullable()->change()->constrained('projects', 'project_id')->onDelete('set null');
        });

        // Use PostgreSQL compatible raw SQL for updates with joins
        DB::statement('UPDATE expenses SET 
            cost_centre_code_snapshot = cost_centres.cost_centre_code, 
            cost_centre_description_snapshot = cost_centres.description 
            FROM cost_centres 
            WHERE expenses.cost_centre_id = cost_centres.cost_centre_id');

        DB::statement('UPDATE expenses SET 
            account_number_snapshot = account_numbers.account_number 
            FROM account_numbers 
            WHERE expenses.account_number_id = account_numbers.account_number_id');

        DB::statement('UPDATE expenses SET 
            project_name_snapshot = projects.project_name 
            FROM projects 
            WHERE expenses.project_id = projects.project_id');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            try {
                $table->dropForeign(['cost_centre_id']);
                $table->dropForeign(['account_number_id']);
                $table->dropForeign(['project_id']);
            } catch (\Exception $e) {}

            $table->foreignId('cost_centre_id')->nullable(false)->change()->constrained('cost_centres', 'cost_centre_id')->onDelete('no action');
            $table->foreignId('account_number_id')->nullable(false)->change()->constrained('account_numbers', 'account_number_id')->onDelete('no action');
            $table->foreignId('project_id')->nullable(false)->change()->constrained('projects', 'project_id')->onDelete('no action');

            $table->dropColumn([
                'cost_centre_code_snapshot',
                'cost_centre_description_snapshot',
                'account_number_snapshot',
                'project_name_snapshot'
            ]);
        });
    }
};
