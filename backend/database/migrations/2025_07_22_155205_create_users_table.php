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
        Schema::create('users', function (Blueprint $table) {
            $table->increments('user_id');
            $table->string('email', 50);
            $table->string('first_name', 50);
            $table->string('last_name', 50);
            $table->string('user_pass', 50)->nullable();
            $table->integer('active_status_id');
            // $table->integer('team_id')->nullable(); // removed, now many-to-many
            $table->integer('department_id')->nullable();
            $table->integer('position_id')->nullable();
            $table->integer('role_id')->nullable();
            $table->timestamp('email_verified_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
