<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['rawg_id', 'name', 'slug'])]
class Developer extends Model
{
    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['rawg_id' => 'integer'];
    }

    /** @return BelongsToMany<Game, $this> */
    public function games(): BelongsToMany
    {
        return $this->belongsToMany(Game::class);
    }
}
