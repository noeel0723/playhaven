<?php

namespace App\Models;

use Database\Factories\PlatformFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['thegamesdb_id', 'name', 'slug'])]
class Platform extends Model
{
    /** @use HasFactory<PlatformFactory> */
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'thegamesdb_id' => 'integer',
        ];
    }

    /** @return BelongsToMany<Game, $this> */
    public function games(): BelongsToMany
    {
        return $this->belongsToMany(Game::class);
    }
}
