<?php

namespace Database\Factories;

use App\Models\LibraryEntry;
use App\Models\Rating;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Rating> */
class RatingFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'library_entry_id' => LibraryEntry::factory(),
            'score' => fake()->numberBetween(1, 10),
        ];
    }
}
