<?php

namespace App\Support;

use App\Models\Game;
use App\Services\TheGamesDb\CatalogImage;

class GameCoverUrl
{
    public static function forGame(Game $game): ?string
    {
        return CatalogImage::url($game->getAttribute('cover_url'));
    }
}
