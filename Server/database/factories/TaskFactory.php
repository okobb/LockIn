<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => $this->faker->sentence(),
            'description' => $this->faker->paragraph(),
            'priority' => $this->faker->numberBetween(1, 4),
            'status' => 'open',
            'source_type' => 'manual',
            'estimated_minutes' => $this->faker->numberBetween(15, 240),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
