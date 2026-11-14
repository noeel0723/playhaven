<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('developers', function (Blueprint $table): void {
            $table->string('description_source', 20)->nullable();
            $table->text('description_source_url')->nullable();
            $table->string('wikipedia_title')->nullable();
            $table->bigInteger('wikipedia_page_id')->nullable();
            $table->string('wikipedia_revision', 32)->nullable();
            $table->timestampTz('bio_fallback_checked_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('developers', fn (Blueprint $table) => $table->dropColumn(['description_source', 'description_source_url', 'wikipedia_title', 'wikipedia_page_id', 'wikipedia_revision', 'bio_fallback_checked_at']));
    }
};
