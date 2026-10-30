<?php

namespace App\Models;

use App\Enums\LibraryStatus;
use Carbon\CarbonImmutable;
use Database\Factories\LibraryEntryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property LibraryStatus|null $status
 * @property CarbonImmutable|null $completed_at
 * @property CarbonImmutable|null $status_changed_at
 */
#[Fillable(['user_id', 'game_id', 'status', 'is_favorite'])]
class LibraryEntry extends Model
{
    /** @use HasFactory<LibraryEntryFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::saving(function (LibraryEntry $entry): void {
            if ($entry->isDirty('status')) {
                $entry->status_changed_at = $entry->status === null ? null : now();
                $entry->completed_at = $entry->status === LibraryStatus::Completed ? ($entry->completed_at ?? now()) : null;
            }
        });
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => LibraryStatus::class,
            'is_favorite' => 'boolean',
            'completed_at' => 'immutable_datetime',
            'status_changed_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Game, $this> */
    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    /** @return HasMany<Playthrough, $this> */
    public function playthroughs(): HasMany
    {
        return $this->hasMany(Playthrough::class);
    }

    /** @return HasOne<Rating, $this> */
    public function rating(): HasOne
    {
        return $this->hasOne(Rating::class);
    }

    /** @return HasOne<Review, $this> */
    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }
}
