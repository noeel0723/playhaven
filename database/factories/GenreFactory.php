<?php

namespace Database\Factories;

use App\Models\Genre;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Genre> */
class GenreFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'igdb_id' => null,
            'name' => fake()->unique()->word(),
            'slug' => fake()->unique()->slug(),
        ];
    }
}
