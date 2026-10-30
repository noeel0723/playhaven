<?php

namespace App\Support;

use App\Models\Game;
use App\Services\Rawg\CatalogImage;

class GameCoverUrl
{
    public static function forGame(Game $game): ?string
    {
        if ($game->rawg_id !== null) {
            return CatalogImage::url($game->getAttribute('cover_url'));
        }
        $imageId = $game->cover_image_id;

        return is_string($imageId) && preg_match('/^[a-zA-Z0-9_]+$/', $imageId)
            ? 'https://images.igdb.com/igdb/image/upload/t_cover_big/'.$imageId.'.jpg' : null;
    }
}
