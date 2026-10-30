<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE library_entries ALTER COLUMN status DROP NOT NULL, ALTER COLUMN status DROP DEFAULT');
            DB::table('library_entries')->where('status', 'backlog')->update(['status' => null]);
            DB::statement('ALTER TABLE library_entries DROP CONSTRAINT IF EXISTS library_entries_status_check');
            DB::statement("ALTER TABLE library_entries ADD CONSTRAINT library_entries_status_check CHECK (status IN ('playing', 'completed', 'paused', 'dropped'))");
        } else {
            Schema::table('library_entries', fn (Blueprint $table) => $table->string('status')->nullable()->default(null)->change());
            DB::table('library_entries')->where('status', 'backlog')->update(['status' => null]);
            Schema::table('library_entries', fn (Blueprint $table) => $table->enum('status', ['playing', 'completed', 'paused', 'dropped'])->nullable()->default(null)->change());
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE library_entries DROP CONSTRAINT IF EXISTS library_entries_status_check');
            DB::statement("ALTER TABLE library_entries ADD CONSTRAINT library_entries_status_check CHECK (status IN ('playing', 'completed', 'paused', 'dropped', 'backlog'))");
            DB::table('library_entries')->whereNull('status')->update(['status' => 'backlog']);
            DB::statement("ALTER TABLE library_entries ALTER COLUMN status SET NOT NULL, ALTER COLUMN status SET DEFAULT 'backlog'");
        } else {
            Schema::table('library_entries', fn (Blueprint $table) => $table->enum('status', ['playing', 'completed', 'paused', 'dropped', 'backlog'])->nullable()->default(null)->change());
            DB::table('library_entries')->whereNull('status')->update(['status' => 'backlog']);
            Schema::table('library_entries', fn (Blueprint $table) => $table->enum('status', ['playing', 'completed', 'paused', 'dropped', 'backlog'])->default('backlog')->change());
        }
    }
};
