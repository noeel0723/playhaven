<?php

namespace Database\Factories;

use App\Models\Game;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Game> */
class GameFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'igdb_id' => null,
            'name' => fake()->unique()->words(3, true),
            'slug' => fake()->unique()->slug(),
            'summary' => fake()->paragraph(),
            'released_on' => fake()->date(),
        ];
    }
}
