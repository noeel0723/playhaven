<?php

namespace App\Models;

use App\Enums\GameConnectionType;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property GameConnectionType $type
 * @property int $related_thegamesdb_id
 * @property CarbonImmutable|null $released_on
 */
#[Fillable(['game_id', 'related_thegamesdb_id', 'type', 'source', 'name', 'released_on', 'cover_url', 'note', 'source_url'])]
class GameConnection extends Model
{
    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['related_thegamesdb_id' => 'integer', 'type' => GameConnectionType::class, 'released_on' => 'immutable_date'];
    }
}
