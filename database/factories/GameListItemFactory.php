<?php

namespace Database\Factories;

use App\Models\Game;
use App\Models\GameList;
use App\Models\GameListItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<GameListItem> */
class GameListItemFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'game_list_id' => GameList::factory(),
            'game_id' => Game::factory(),
            'position' => 1,
            'notes' => null,
        ];
    }
}
