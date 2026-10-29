<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['developers', 'publishers'] as $name) {
            Schema::create($name, function (Blueprint $table): void {
                $table->id();
                $table->bigInteger('rawg_id')->unique();
                $table->string('name');
                $table->string('slug')->unique();
                $table->timestampsTz();
            });
        }
        Schema::create('developer_game', function (Blueprint $table): void {
            $table->foreignId('developer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->primary(['developer_id', 'game_id']);
            $table->index('game_id');
        });
        Schema::create('game_publisher', function (Blueprint $table): void {
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->foreignId('publisher_id')->constrained()->cascadeOnDelete();
            $table->primary(['game_id', 'publisher_id']);
            $table->index('publisher_id');
        });
        Schema::table('games', function (Blueprint $table): void {
            $table->string('website_url', 2048)->nullable();
            $table->timestampTz('credits_synced_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('developer_game');
        Schema::dropIfExists('game_publisher');
        Schema::dropIfExists('developers');
        Schema::dropIfExists('publishers');
        Schema::table('games', function (Blueprint $table): void {
            $table->dropColumn(['website_url', 'credits_synced_at']);
        });
    }
};
