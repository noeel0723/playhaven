<?php

namespace Database\Factories;

use App\Enums\LibraryStatus;
use App\Models\Game;
use App\Models\LibraryEntry;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<LibraryEntry> */
class LibraryEntryFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'game_id' => Game::factory(),
            'status' => LibraryStatus::Backlog,
            'is_favorite' => false,
        ];
    }
}
