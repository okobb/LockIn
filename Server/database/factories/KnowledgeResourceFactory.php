<?php

namespace Database\Factories;

use App\Models\KnowledgeResource;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class KnowledgeResourceFactory extends Factory
{
    protected $model = KnowledgeResource::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'url' => $this->faker->url(),
            'title' => $this->faker->sentence(),
            'summary' => $this->faker->paragraph(),
            'type' => $this->faker->randomElement([
                \RESOURCE_TYPE_ARTICLE,
                \RESOURCE_TYPE_VIDEO,
                \RESOURCE_TYPE_DOCUMENT,
                \RESOURCE_TYPE_IMAGE,
                \RESOURCE_TYPE_WEBSITE,
                \RESOURCE_TYPE_DOCUMENTATION
            ]),
            'is_read' => $this->faker->boolean(),
            'is_archived' => false,
            'is_favorite' => $this->faker->boolean(),
            'estimated_time_minutes' => $this->faker->numberBetween(5, 60),
        ];
    }
}
