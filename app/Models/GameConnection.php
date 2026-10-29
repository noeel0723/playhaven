<?php

namespace App\Models;

use App\Enums\GameConnectionType;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property GameConnectionType $type
 * @property CarbonImmutable|null $released_on
 */
#[Fillable(['game_id', 'related_rawg_id', 'type', 'source', 'name', 'released_on', 'cover_url', 'note', 'source_url'])]
class GameConnection extends Model
{
    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['related_rawg_id' => 'integer', 'type' => GameConnectionType::class, 'released_on' => 'immutable_date'];
    }
}
