<?php

namespace Database\Factories;

use App\Models\ContextSnapshot;
use App\Models\FocusSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ContextSnapshot>
 */
class ContextSnapshotFactory extends Factory
{
    protected $model = ContextSnapshot::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'focus_session_id' => FocusSession::factory(), 
            'title' => $this->faker->sentence(4),
            'type' => $this->faker->randomElement(['manual', 'auto_interval', 'auto_pause']),
            
            // Git Context
            'git_branch' => $this->faker->randomElement(['main', 'develop', 'feature/' . $this->faker->slug(), 'fix/' . $this->faker->slug()]),
            'git_last_commit' => $this->faker->sha1(),
            'repository_source' => 'github/' . $this->faker->slug(),
            'git_files_changed' => $this->faker->words(3),
            
            // Environment State
            'browser_state' => $this->generateBrowserState(),
            'ide_state' => $this->generateIdeState(),
            
            // Metadata
            'quality_score' => $this->faker->numberBetween(60, 100),
            'voice_duration_sec' => $this->faker->optional()->numberBetween(10, 120),
            'text_note' => $this->faker->optional()->paragraph(),
            'ai_resume_checklist' => $this->faker->sentences(3),
            
            'created_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
        ];
    }

    private function generateBrowserState(): array
    {
        $tabs = [];
        for ($i = 0; $i < $this->faker->numberBetween(3, 8); $i++) {
            $tabs[] = [
                'title' => $this->faker->catchPhrase(),
                'url' => $this->faker->url()
            ];
        }
        return $tabs;
    }

    private function generateIdeState(): array
    {
        $files = [];
        for ($i = 0; $i < $this->faker->numberBetween(1, 5); $i++) {
            $files[] = [
                'path' => 'app/' . $this->faker->word() . '/' . $this->faker->word() . '.php',
                'cursor_line' => $this->faker->numberBetween(10, 200)
            ];
        }
        return ['open_files' => $files];
    }
}
