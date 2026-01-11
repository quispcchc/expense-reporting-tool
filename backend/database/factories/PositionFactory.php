<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Position>
 */
class PositionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'position_name' => $this->faker->jobTitle(),
            'position_desc' => $this->faker->sentence(),
            'active_status_id' => $this->faker->randomElement([1, 2]),
        ];
    }
}
