<?php

namespace Database\Factories;

use App\Enums\ListVisibility;
use App\Models\GameList;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<GameList> */
class GameListFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->words(3, true),
            'slug' => fake()->unique()->slug(),
            'description' => fake()->sentence(),
            'visibility' => ListVisibility::Public,
        ];
    }
}
