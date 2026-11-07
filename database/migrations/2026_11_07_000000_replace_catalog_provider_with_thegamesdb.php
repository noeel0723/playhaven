<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['games', 'genres', 'platforms', 'developers', 'publishers'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->renameColumn('rawg_id', 'thegamesdb_id'));
        }
        foreach (['games', 'genres', 'platforms'] as $name) {
            Schema::table($name, function (Blueprint $table) use ($name): void {
                $table->dropUnique($name.'_igdb_id_unique');
                $table->dropColumn('igdb_id');
            });
        }
        Schema::table('games', function (Blueprint $table): void {
            $table->renameColumn('rawg_updated_at', 'source_updated_at');
            $table->renameColumn('rawg_details_synced_at', 'details_synced_at');
            $table->dropColumn(['igdb_updated_at', 'cover_image_id']);
        });
        Schema::table('game_connections', fn (Blueprint $table) => $table->renameColumn('related_rawg_id', 'related_thegamesdb_id'));
    }

    public function down(): void
    {
        Schema::table('game_connections', fn (Blueprint $table) => $table->renameColumn('related_thegamesdb_id', 'related_rawg_id'));
        Schema::table('games', function (Blueprint $table): void {
            $table->renameColumn('source_updated_at', 'rawg_updated_at');
            $table->renameColumn('details_synced_at', 'rawg_details_synced_at');
            $table->string('cover_image_id')->nullable();
            $table->timestampTz('igdb_updated_at')->nullable();
        });
        foreach (['games', 'genres', 'platforms'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->bigInteger('igdb_id')->nullable()->unique());
        }
        foreach (['games', 'genres', 'platforms', 'developers', 'publishers'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->renameColumn('thegamesdb_id', 'rawg_id'));
        }
    }
};
