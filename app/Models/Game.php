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
 * @property int|null $rawg_id
 * @property CarbonImmutable|null $released_on
 * @property CarbonImmutable|null $igdb_updated_at
 * @property CarbonImmutable|null $synced_at
 * @property CarbonImmutable|null $rawg_updated_at
 * @property CarbonImmutable|null $rawg_details_synced_at
 * @property CarbonImmutable|null $connections_synced_at
 * @property CarbonImmutable|null $connections_checked_at
 * @property CarbonImmutable|null $credits_synced_at
 */
#[Fillable(['igdb_id', 'rawg_id', 'slug', 'name', 'summary', 'storyline', 'released_on', 'cover_image_id', 'cover_url', 'website_url', 'igdb_updated_at', 'rawg_updated_at', 'rawg_details_synced_at', 'credits_synced_at', 'synced_at'])]
class Game extends Model
{
    /** @use HasFactory<GameFactory> */
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'igdb_id' => 'integer',
            'rawg_id' => 'integer',
            'rawg_updated_at' => 'immutable_datetime',
            'rawg_details_synced_at' => 'immutable_datetime',
            'connections_synced_at' => 'immutable_datetime',
            'connections_checked_at' => 'immutable_datetime',
            'connections_truncated' => 'boolean',
            'credits_synced_at' => 'immutable_datetime',
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

    /** @return HasMany<GameConnection, $this> */
    public function connections(): HasMany
    {
        return $this->hasMany(GameConnection::class);
    }

    /** @return BelongsToMany<Developer, $this> */
    public function developers(): BelongsToMany
    {
        return $this->belongsToMany(Developer::class);
    }

    /** @return BelongsToMany<Publisher, $this> */
    public function publishers(): BelongsToMany
    {
        return $this->belongsToMany(Publisher::class);
    }
}
