<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_lists', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 150);
            $table->string('slug');
            $table->text('description')->nullable();
            $table->enum('visibility', ['public', 'unlisted', 'private'])->default('public');
            $table->timestampsTz();
            $table->unique(['user_id', 'slug']);
            $table->index(['user_id', 'visibility']);
        });

        Schema::create('game_list_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('game_list_id')->constrained()->cascadeOnDelete();
            $table->foreignId('game_id')->constrained()->restrictOnDelete();
            $table->rawColumn('position', 'integer CHECK (position >= 1)');
            $table->text('notes')->nullable();
            $table->timestampsTz();
            $table->unique(['game_list_id', 'game_id']);
            $table->index(['game_list_id', 'position', 'id']);
            $table->index('game_id');
        });

        Schema::create('follows', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('follower_id')->constrained('users')->cascadeOnDelete();
            $table->rawColumn('followed_id', 'bigint CHECK (followed_id <> follower_id)');
            $table->foreign('followed_id')->references('id')->on('users')->cascadeOnDelete();
            $table->timestampsTz();
            $table->unique(['follower_id', 'followed_id']);
            $table->index('followed_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('follows');
        Schema::dropIfExists('game_list_items');
        Schema::dropIfExists('game_lists');
    }
};
