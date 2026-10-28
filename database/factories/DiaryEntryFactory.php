<?php

namespace Database\Factories;

use App\Models\DiaryEntry;
use App\Models\Playthrough;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<DiaryEntry> */
class DiaryEntryFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'playthrough_id' => Playthrough::factory(),
            'logged_on' => '2026-01-02',
            'minutes_played' => 60,
            'notes' => fake()->sentence(),
        ];
    }
}
