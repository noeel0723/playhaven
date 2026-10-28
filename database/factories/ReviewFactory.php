<?php

namespace Database\Factories;

use App\Models\LibraryEntry;
use App\Models\Review;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Review> */
class ReviewFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'library_entry_id' => LibraryEntry::factory(),
            'body' => fake()->paragraph(),
            'contains_spoilers' => false,
            'is_public' => true,
        ];
    }
}
