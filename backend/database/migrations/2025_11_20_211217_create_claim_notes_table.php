<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('claim_notes', function (Blueprint $table) {
            $table->integer('claim_note_id')->primary();
            $table->text('claim_note_text');
            $table->foreignId('user_id')->constrained('users', 'user_id');

            $table->foreignId('claim_id')
                ->constrained('claim', 'claim_id')
                ->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('claim_notes');
    }
};
