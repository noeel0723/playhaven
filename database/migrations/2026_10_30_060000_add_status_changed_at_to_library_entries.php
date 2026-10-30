<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('library_entries', function (Blueprint $table) {
            $table->timestampTz('status_changed_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('library_entries', fn (Blueprint $table) => $table->dropColumn('status_changed_at'));
    }
};
