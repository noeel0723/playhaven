<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_profiles', function (Blueprint $table): void {
            $table->boolean('share_recent_completed')->default(false);
        });
        Schema::table('library_entries', function (Blueprint $table): void {
            $table->timestampTz('completed_at')->nullable();
            $table->index(['user_id', 'status', 'completed_at', 'id']);
        });
        Schema::create('profile_game_favorites', function (Blueprint $table): void {
            $table->foreignId('user_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('game_id')->constrained()->restrictOnDelete();
            $table->rawColumn('position', 'integer CHECK (position BETWEEN 1 AND 4)');
            $table->primary(['user_profile_id', 'game_id']);
            $table->unique(['user_profile_id', 'position']);
            $table->index('game_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_game_favorites');
        Schema::table('library_entries', function (Blueprint $table): void {
            $table->dropIndex(['user_id', 'status', 'completed_at', 'id']);
            $table->dropColumn('completed_at');
        });
        Schema::table('user_profiles', function (Blueprint $table): void {
            $table->dropColumn('share_recent_completed');
        });
    }
};
