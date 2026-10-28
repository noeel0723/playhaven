<?php

namespace App\Models;

use Database\Factories\GameListItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['game_list_id', 'game_id', 'position', 'notes'])]
class GameListItem extends Model
{
    /** @use HasFactory<GameListItemFactory> */
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'position' => 'integer',
        ];
    }

    /** @return BelongsTo<GameList, $this> */
    public function gameList(): BelongsTo
    {
        return $this->belongsTo(GameList::class);
    }

    /** @return BelongsTo<Game, $this> */
    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }
}
