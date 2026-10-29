<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table): void {
            $table->timestampTz('connections_synced_at')->nullable();
            $table->timestampTz('connections_checked_at')->nullable();
            $table->boolean('connections_truncated')->default(false);
        });
        Schema::create('game_connections', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->bigInteger('related_rawg_id');
            $table->enum('type', ['prequel', 'sequel', 'universe', 'series', 'addition', 'parent']);
            $table->enum('source', ['rawg', 'curated']);
            $table->string('name');
            $table->date('released_on')->nullable();
            $table->string('cover_url', 2048)->nullable();
            $table->text('note')->nullable();
            $table->string('source_url', 2048)->nullable();
            $table->timestampsTz();
            $table->unique(['game_id', 'related_rawg_id', 'type', 'source'], 'game_connections_unique');
            $table->index('related_rawg_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_connections');
        Schema::table('games', function (Blueprint $table): void {
            $table->dropColumn(['connections_synced_at', 'connections_checked_at', 'connections_truncated']);
        });
    }
};
