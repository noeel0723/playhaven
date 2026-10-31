<?php

namespace App\Models;

use App\Enums\LibraryStatus;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property LibraryStatus $status
 * @property CarbonImmutable $logged_on
 * @property CarbonImmutable|null $completed_on
 */
#[Fillable(['library_entry_id', 'logged_on', 'status', 'completed_on', 'review_body', 'contains_spoilers'])]
class GameDiaryLog extends Model
{
    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['logged_on' => 'immutable_date', 'completed_on' => 'immutable_date', 'status' => LibraryStatus::class, 'contains_spoilers' => 'boolean'];
    }

    /** @return BelongsTo<LibraryEntry, $this> */
    public function libraryEntry(): BelongsTo
    {
        return $this->belongsTo(LibraryEntry::class);
    }
}
