<?php

namespace App\Services;

use App\Models\Playthrough;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class PlayerHistory
{
    // Call inside a transaction. Always lock the library entry before the run.
    public function lock(User $user, Playthrough $playthrough): Playthrough
    {
        $entry = $user->libraryEntries()->whereKey($playthrough->library_entry_id)->lockForUpdate()->firstOrFail();

        return $entry->playthroughs()->whereKey($playthrough->id)->lockForUpdate()->firstOrFail();
    }

    public function validateSessionDate(Playthrough $run, string $date): void
    {
        if (($run->started_on && $date < $run->started_on->format('Y-m-d')) ||
            ($run->finished_on && $date > $run->finished_on->format('Y-m-d'))) {
            throw ValidationException::withMessages(['logged_on' => 'Choose a date within this playthrough’s start and finish dates.']);
        }
    }

    /** @param array<string, mixed> $data */
    public function validateRunDates(Playthrough $run, array $data): void
    {
        if (! empty($data['started_on']) && $run->diaryEntries()->where('logged_on', '<', $data['started_on'])->exists()) {
            throw ValidationException::withMessages(['started_on' => 'The start date cannot be after an existing diary session.']);
        }
        if (! empty($data['finished_on']) && $run->diaryEntries()->where('logged_on', '>', $data['finished_on'])->exists()) {
            throw ValidationException::withMessages(['finished_on' => 'The finish date cannot be before an existing diary session.']);
        }
    }
}
