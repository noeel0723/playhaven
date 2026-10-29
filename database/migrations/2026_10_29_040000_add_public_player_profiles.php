<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_profiles', function (Blueprint $table): void {
            $table->boolean('is_public')->default(false);
        });
        Schema::table('reviews', function (Blueprint $table): void {
            $table->index(['is_public', 'updated_at', 'id']);
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table): void {
            $table->dropIndex(['is_public', 'updated_at', 'id']);
        });
        Schema::table('user_profiles', function (Blueprint $table): void {
            $table->dropColumn('is_public');
        });
    }
};
