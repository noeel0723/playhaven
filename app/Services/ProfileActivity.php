<?php

namespace App\Services;

use App\Models\LibraryEntry;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class ProfileActivity
{
    /** @return Collection<int, LibraryEntry> */
    public function recent(User $user): Collection
    {
        $changes = DB::table('library_entries')->where('user_id', $user->id)
            ->selectRaw('id AS library_entry_id, updated_at');
        foreach (['ratings', 'reviews', 'playthroughs'] as $table) {
            $changes->unionAll(DB::table($table)->join('library_entries', 'library_entries.id', '=', "$table.library_entry_id")
                ->where('library_entries.user_id', $user->id)->select("$table.library_entry_id", "$table.updated_at"));
        }
        $changes->unionAll(DB::table('diary_entries')->join('playthroughs', 'playthroughs.id', '=', 'diary_entries.playthrough_id')
            ->join('library_entries', 'library_entries.id', '=', 'playthroughs.library_entry_id')
            ->where('library_entries.user_id', $user->id)->select('playthroughs.library_entry_id', 'diary_entries.updated_at'));
        $latest = DB::query()->fromSub($changes, 'profile_activity')->whereNotNull('updated_at')->select('library_entry_id')
            ->selectRaw('MAX(updated_at) AS occurred_at')->groupBy('library_entry_id')
            ->orderByDesc('occurred_at')->orderByDesc('library_entry_id')->limit(4)->get();
        $entries = $user->libraryEntries()->whereIn('id', $latest->pluck('library_entry_id'))
            ->with(['rating', 'review', 'game' => fn (BelongsTo $query) => $query->with(['genres', 'platforms'])])->get()->keyBy('id');

        return new Collection($latest->map(function ($change) use ($entries): ?LibraryEntry {
            $entry = $entries->get($change->library_entry_id);
            $entry?->setAttribute('activity_at', CarbonImmutable::parse($change->occurred_at)->toISOString());

            return $entry;
        })->filter()->values()->all());
    }
}
