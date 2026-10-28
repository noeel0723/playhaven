<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<UserProfile> */
class UserProfileFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'username' => fake()->unique()->regexify('[a-z][a-z0-9_]{11}'),
            'display_name' => fake()->name(),
            'bio' => fake()->sentence(),
        ];
    }
}
