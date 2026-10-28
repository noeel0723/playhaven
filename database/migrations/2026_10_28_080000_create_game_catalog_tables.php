<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('games', function (Blueprint $table): void {
            $table->id();
            $table->bigInteger('igdb_id')->nullable()->unique();
            $table->string('slug')->unique();
            $table->string('name')->index();
            $table->text('summary')->nullable();
            $table->text('storyline')->nullable();
            $table->date('released_on')->nullable()->index();
            $table->string('cover_image_id')->nullable();
            $table->timestampTz('igdb_updated_at')->nullable();
            $table->timestampTz('synced_at')->nullable();
            $table->timestampsTz();
        });

        foreach (['genres', 'platforms'] as $name) {
            Schema::create($name, function (Blueprint $table): void {
                $table->id();
                $table->bigInteger('igdb_id')->nullable()->unique();
                $table->string('name');
                $table->string('slug')->unique();
                $table->timestampsTz();
            });
        }

        Schema::create('game_genre', function (Blueprint $table): void {
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->foreignId('genre_id')->constrained()->cascadeOnDelete();
            $table->primary(['game_id', 'genre_id']);
            $table->index('genre_id');
        });

        Schema::create('game_platform', function (Blueprint $table): void {
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->foreignId('platform_id')->constrained()->cascadeOnDelete();
            $table->primary(['game_id', 'platform_id']);
            $table->index('platform_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_platform');
        Schema::dropIfExists('game_genre');
        Schema::dropIfExists('platforms');
        Schema::dropIfExists('genres');
        Schema::dropIfExists('games');
    }
};
