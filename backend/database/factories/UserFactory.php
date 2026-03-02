<?php

namespace Database\Factories;

use App\Enums\ActiveStatus;
use App\Enums\RoleLevel;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'user_pass' => static::$password ??= Hash::make('password'),
            //            'remember_token' => Str::random(10),
            'active_status_id' => ActiveStatus::ACTIVE,
            'role_id' => $this->faker->randomElement([RoleLevel::SUPER_ADMIN, RoleLevel::USER]),
            'position_id' => fake()->numberBetween(1, 4),
            'department_id' => fake()->numberBetween(1, 5),
            // 'team_id' => fake()->numberBetween(1, 10),

        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
