<?php

namespace Database\Seeders;

use App\Models\ContextSnapshot;
use App\Models\DailyStat;
use App\Models\FocusSession;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

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

        $sessions = FocusSession::factory()
            ->count(10)
            ->for($user)
            ->sequence(fn ($sequence) => [
                'status' => 'completed',
                'ended_at' => now()->subDays($sequence->index % 7)->subMinutes(rand(10, 120)),
                'actual_duration_min' => rand(15, 60),
                'started_at' => now()->subDays($sequence->index % 7)->subMinutes(rand(10, 120))->subMinutes(rand(15, 60)),
            ])
            ->create()
            ->each(function ($session) {
                ContextSnapshot::factory()
                    ->count(rand(1, 3))
                    ->for($session)
                    ->for($session->user)
                    ->create();
            });

        // Populate daily_stats table
        $statsByDate = [];
        foreach ($sessions as $session) {
            $date = $session->ended_at->toDateString();
            if (!isset($statsByDate[$date])) {
                $statsByDate[$date] = [
                    'flow_time_min' => 0,
                    'deep_work_blocks' => 0,
                    'contexts_saved' => 0,
                ];
            }
            $statsByDate[$date]['flow_time_min'] += $session->actual_duration_min ?? 0;
            $statsByDate[$date]['deep_work_blocks'] += 1;
            $statsByDate[$date]['contexts_saved'] += $session->contextSnapshots()->count();
        }

        foreach ($statsByDate as $date => $stats) {
            DailyStat::updateOrCreate(
                ['user_id' => $user->id, 'date' => $date],
                $stats
            );
        }

        // Clear stats cache
        Cache::forget("stats:weekly:{$user->id}");
        Cache::forget("stats:daily:{$user->id}");
        Cache::forget("stats:streak:{$user->id}");

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
