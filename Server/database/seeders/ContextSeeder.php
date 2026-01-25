<?php

namespace Database\Seeders;

use App\Models\ContextSnapshot;
use App\Models\FocusSession;
use App\Models\User;
use Illuminate\Database\Seeder;

class ContextSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::query()->first() ?? User::factory()->create([
            'email' => 'test@example.com',
            'name' => 'Test User'
        ]);

        FocusSession::factory()
            ->count(10)
            ->for($user)
            ->create()
            ->each(function ($session) {
                ContextSnapshot::factory()
                    ->count(rand(1, 3))
                    ->for($session)
                    ->for($session->user)
                    ->create();
            });

        $activeSession = FocusSession::factory()
            ->for($user)
            ->create([
                'title' => 'Refactoring DashboardService',
                'status' => 'active',
                'started_at' => now()->subMinutes(25),
                'planned_duration_min' => 45
            ]);

        ContextSnapshot::factory()
            ->for($user)
            ->for($activeSession)
            ->create([
                'title' => 'Refactoring DashboardService Context',
                'created_at' => now()->subMinutes(25),
                'git_branch' => 'refactor/optimization',
                'quality_score' => 95
            ]);
    }
}
