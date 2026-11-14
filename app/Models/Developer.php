<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property int $id
 * @property int $rawg_id
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property string|null $image_url
 * @property CarbonImmutable|null $details_synced_at
 * @property string|null $description_source
 * @property string|null $description_source_url
 * @property string|null $wikipedia_title
 * @property int|null $wikipedia_page_id
 * @property string|null $wikipedia_revision
 * @property CarbonImmutable|null $bio_fallback_checked_at
 */
#[Fillable(['rawg_id', 'name', 'slug', 'description', 'image_url', 'details_synced_at', 'description_source', 'description_source_url', 'wikipedia_title', 'wikipedia_page_id', 'wikipedia_revision', 'bio_fallback_checked_at'])]
class Developer extends Model
{
    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['rawg_id' => 'integer', 'details_synced_at' => 'immutable_datetime', 'wikipedia_page_id' => 'integer', 'bio_fallback_checked_at' => 'immutable_datetime'];
    }

    /** @return BelongsToMany<Game, $this> */
    public function games(): BelongsToMany
    {
        return $this->belongsToMany(Game::class);
    }
}
