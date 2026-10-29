<?php

namespace App\Models;

use App\Enums\PlaythroughStatus;
use Carbon\CarbonImmutable;
use Database\Factories\PlaythroughFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property PlaythroughStatus $status
 * @property CarbonImmutable|null $started_on
 * @property CarbonImmutable|null $finished_on
 */
#[Fillable(['library_entry_id', 'platform_id', 'label', 'status', 'started_on', 'finished_on'])]
class Playthrough extends Model
{
    /** @use HasFactory<PlaythroughFactory> */
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => PlaythroughStatus::class,
            'started_on' => 'immutable_date',
            'finished_on' => 'immutable_date',
        ];
    }

    /** @return BelongsTo<LibraryEntry, $this> */
    public function libraryEntry(): BelongsTo
    {
        return $this->belongsTo(LibraryEntry::class);
    }

    /** @return BelongsTo<Platform, $this> */
    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    /** @return HasMany<DiaryEntry, $this> */
    public function diaryEntries(): HasMany
    {
        return $this->hasMany(DiaryEntry::class);
    }
}
