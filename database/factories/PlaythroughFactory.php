<?php

namespace Database\Factories;

use App\Enums\PlaythroughStatus;
use App\Models\LibraryEntry;
use App\Models\Playthrough;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Playthrough> */
class PlaythroughFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'library_entry_id' => LibraryEntry::factory(),
            'platform_id' => null,
            'label' => null,
            'status' => PlaythroughStatus::Playing,
            'started_on' => '2026-01-01',
            'finished_on' => null,
        ];
    }
}
