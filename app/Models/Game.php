<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\GameFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

/**
 * @property CarbonImmutable|null $released_on
 * @property CarbonImmutable|null $igdb_updated_at
 * @property CarbonImmutable|null $synced_at
 */
#[Fillable(['igdb_id', 'slug', 'name', 'summary', 'storyline', 'released_on', 'cover_image_id', 'igdb_updated_at', 'synced_at'])]
class Game extends Model
{
    /** @use HasFactory<GameFactory> */
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'igdb_id' => 'integer',
            'released_on' => 'immutable_date',
            'igdb_updated_at' => 'immutable_datetime',
            'synced_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsToMany<Genre, $this> */
    public function genres(): BelongsToMany
    {
        return $this->belongsToMany(Genre::class);
    }

    /** @return BelongsToMany<Platform, $this> */
    public function platforms(): BelongsToMany
    {
        return $this->belongsToMany(Platform::class);
    }

    /** @return HasMany<LibraryEntry, $this> */
    public function libraryEntries(): HasMany
    {
        return $this->hasMany(LibraryEntry::class);
    }

    /** @return HasManyThrough<Rating, LibraryEntry, $this> */
    public function ratings(): HasManyThrough
    {
        return $this->hasManyThrough(Rating::class, LibraryEntry::class);
    }

    /** @return HasManyThrough<Review, LibraryEntry, $this> */
    public function reviews(): HasManyThrough
    {
        return $this->hasManyThrough(Review::class, LibraryEntry::class);
    }
}
