<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['games', 'genres', 'platforms'] as $name) {
            Schema::table($name, function (Blueprint $table): void {
                $table->bigInteger('rawg_id')->nullable()->unique();
            });
        }
        Schema::table('games', function (Blueprint $table): void {
            $table->string('cover_url', 2048)->nullable();
            $table->timestampTz('rawg_updated_at')->nullable();
            $table->timestampTz('rawg_details_synced_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table): void {
            $table->dropColumn(['cover_url', 'rawg_updated_at', 'rawg_details_synced_at']);
        });
        foreach (['games', 'genres', 'platforms'] as $name) {
            Schema::table($name, function (Blueprint $table): void {
                $table->dropUnique(['rawg_id']);
                $table->dropColumn('rawg_id');
            });
        }
    }
};
