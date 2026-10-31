<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_diary_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('library_entry_id')->constrained()->cascadeOnDelete();
            $table->date('logged_on');
            $table->string('status', 16);
            $table->date('completed_on')->nullable();
            $table->text('review_body')->nullable();
            $table->boolean('contains_spoilers')->default(false);
            $table->timestampsTz();
            $table->index(['library_entry_id', 'logged_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_diary_logs');
    }
};
