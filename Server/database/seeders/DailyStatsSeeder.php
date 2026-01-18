<?php

namespace Database\Seeders;

use App\Models\DailyStat;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DailyStatsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first user or create one
        $user = User::first();
        
        if (!$user) {
            $user = User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);
        }

        // Clear existing stats for this week to avoid unique constraint errors
        $startOfWeek = now()->startOfWeek();
        $endOfWeek = now()->endOfWeek();
        
        DailyStat::where('user_id', $user->id)
            ->whereBetween('date', [$startOfWeek->toDateString(), $endOfWeek->toDateString()])
            ->delete();

        // Generate stats for the last 7 days including today
        $currentDate = now()->startOfWeek();
        $today = now();

        while ($currentDate <= $today) {
            // Skip future days if any (though startOfWeek to today should be fine)
            if ($currentDate > $today) break;

            DailyStat::create([
                'user_id' => $user->id,
                'date' => $currentDate->toDateString(),
                'flow_time_min' => rand(120, 300), // 2-5 hours
                'deep_work_blocks' => rand(2, 6),
                'tasks_completed' => rand(3, 8),
                'contexts_saved' => rand(1, 3),
                'contexts_restored' => rand(1, 3),
                'checklist_items_completed' => rand(5, 15),
                'notifications_blocked' => rand(10, 50),
                'estimated_time_saved_min' => rand(15, 60),
            ]);

            $currentDate->addDay();
        }
        
        // Add some data for last week to test trends
        $lastWeekStart = now()->subWeek()->startOfWeek();
        $lastWeekDate = $lastWeekStart->copy();
        
        // Check if last week stats specific exists
        DailyStat::query()->where('user_id', $user->id)
             ->whereBetween('date', [$lastWeekStart->toDateString(), $lastWeekStart->copy()->addDays(2)->toDateString()])
             ->delete();

        for ($i = 0; $i < 3; $i++) {
             DailyStat::create([
                'user_id' => $user->id,
                'date' => $lastWeekDate->toDateString(),
                'flow_time_min' => rand(100, 250),
                'deep_work_blocks' => rand(1, 4),
                'tasks_completed' => rand(2, 5),
            ]);
            $lastWeekDate->addDay();
        }

        $this->command->info('Daily stats seeded for user: ' . $user->email);
    }
}
