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
            // Add snapshot columns for historical data integrity
            $table->string('cost_centre_code_snapshot')->nullable()->after('cost_centre_id');
            $table->string('cost_centre_description_snapshot')->nullable()->after('cost_centre_code_snapshot');
            
            // Adding for completeness as it's common for these to be needed too
            $table->string('account_number_snapshot')->nullable()->after('account_number_id');
            $table->string('project_name_snapshot')->nullable()->after('project_id');

            // Drop existing foreign keys to update them to 'set null'
            $table->dropForeign(['cost_centre_id']);
            $table->dropForeign(['account_number_id']);
            $table->dropForeign(['project_id']);

            // Re-add foreign keys with 'set null' on delete
            $table->foreignId('cost_centre_id')->nullable()->change()->constrained('cost_centres', 'cost_centre_id')->onDelete('set null');
            $table->foreignId('account_number_id')->nullable()->change()->constrained('account_numbers', 'account_number_id')->onDelete('set null');
            $table->foreignId('project_id')->nullable()->change()->constrained('projects', 'project_id')->onDelete('set null');
        });

        // Optional: Populate snapshot columns for existing data
        DB::table('expenses')
            ->join('cost_centres', 'expenses.cost_centre_id', '=', 'cost_centres.cost_centre_id')
            ->update([
                'expenses.cost_centre_code_snapshot' => DB::raw('cost_centres.cost_centre_code'),
                'expenses.cost_centre_description_snapshot' => DB::raw('cost_centres.description'),
            ]);

        DB::table('expenses')
            ->join('account_numbers', 'expenses.account_number_id', '=', 'account_numbers.account_number_id')
            ->update([
                'expenses.account_number_snapshot' => DB::raw('account_numbers.account_number'),
            ]);

        DB::table('expenses')
            ->join('projects', 'expenses.project_id', '=', 'projects.project_id')
            ->update([
                'expenses.project_name_snapshot' => DB::raw('projects.project_name'),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropForeign(['cost_centre_id']);
            $table->dropForeign(['account_number_id']);
            $table->dropForeign(['project_id']);

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
