<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Team;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Team>
 */
class TeamFactory extends Factory
{

    public function definition(): array
    {
        return [
            'team_name' => $this->faker->company(),
            'team_abbreviation' => strtoupper($this->faker->lexify('???')),
            'team_desc' => $this->faker->sentence(),
            'active_status_id' => $this->faker->randomElement([1, 2]),
        ];
    }
}
