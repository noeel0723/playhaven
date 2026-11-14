<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('developers', function (Blueprint $table): void {
            $table->text('description')->nullable();
            $table->text('image_url')->nullable();
            $table->timestampTz('details_synced_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('developers', fn (Blueprint $table) => $table->dropColumn(['description', 'image_url', 'details_synced_at']));
    }
};
