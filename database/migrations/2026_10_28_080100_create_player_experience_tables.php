<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('username', 30)->nullable();
            $table->string('display_name', 80)->nullable();
            $table->text('bio')->nullable();
            $table->string('avatar_path')->nullable();
            $table->timestampsTz();
        });

        DB::statement('CREATE UNIQUE INDEX user_profiles_username_unique ON user_profiles (LOWER(username))');

        Schema::create('library_entries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Preserve player history when pruning or resynchronizing the catalog.
            $table->foreignId('game_id')->constrained()->restrictOnDelete();
            $table->enum('status', ['playing', 'completed', 'paused', 'dropped', 'backlog'])->default('backlog');
            $table->boolean('is_favorite')->default(false);
            $table->timestampsTz();
            $table->unique(['user_id', 'game_id']);
            $table->index(['user_id', 'status']);
            $table->index('game_id');
        });

        Schema::create('playthroughs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('library_entry_id')->constrained()->cascadeOnDelete();
            $table->foreignId('platform_id')->nullable()->constrained()->nullOnDelete();
            $table->string('label', 100)->nullable();
            $table->enum('status', ['playing', 'completed', 'paused', 'dropped'])->default('playing');
            $table->date('started_on')->nullable();
            $table->rawColumn('finished_on', 'date CHECK (started_on IS NULL OR finished_on >= started_on)')->nullable();
            $table->timestampsTz();
            $table->index(['library_entry_id', 'started_on']);
            $table->index('platform_id');
        });

        Schema::create('diary_entries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('playthrough_id')->constrained()->cascadeOnDelete();
            $table->date('logged_on');
            $table->rawColumn('minutes_played', 'integer CHECK (minutes_played >= 0)')->nullable();
            $table->text('notes')->nullable();
            $table->timestampsTz();
            $table->index(['playthrough_id', 'logged_on']);
        });

        Schema::create('ratings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('library_entry_id')->unique()->constrained()->cascadeOnDelete();
            $table->rawColumn('score', 'smallint CHECK (score BETWEEN 1 AND 10 AND score = CAST(score AS INTEGER))');
            $table->timestampsTz();
        });

        Schema::create('reviews', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('library_entry_id')->unique()->constrained()->cascadeOnDelete();
            $table->rawColumn('body', 'text CHECK (length(trim(body)) > 0)');
            $table->boolean('contains_spoilers')->default(false);
            $table->boolean('is_public')->default(true);
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        foreach (['reviews', 'ratings', 'diary_entries', 'playthroughs', 'library_entries', 'user_profiles'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
