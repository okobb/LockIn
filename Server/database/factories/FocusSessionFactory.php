<?php

namespace Database\Factories;

use App\Models\FocusSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\FocusSession>
 */
class FocusSessionFactory extends Factory
{
    protected $model = FocusSession::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startedAt = $this->faker->dateTimeBetween('-1 week', 'now');
        $plannedDuration = $this->faker->numberBetween(15, 60);

        return [
            'user_id' => User::factory(),
            'title' => $this->faker->sentence(3),
            'planned_duration_min' => $plannedDuration,
            'actual_duration_min' => $this->faker->optional(0.8, 0)->numberBetween(5, $plannedDuration), 
            'started_at' => $startedAt,
            'ended_at' => $this->faker->optional(0.8)->dateTimeInInterval($startedAt, "+{$plannedDuration} minutes"),
            'paused_duration_sec' => $this->faker->numberBetween(0, 300),
            'status' => $this->faker->randomElement(['completed', 'abandoned', 'active']),
            'checklist_completed' => $this->faker->numberBetween(0, 5),
            'checklist_total' => 5,
        ];
    }
}
