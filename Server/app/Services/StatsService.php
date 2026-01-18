<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\DailyStat;
use App\Models\FocusSession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class StatsService
{
    /**
     * Get aggregated stats for the current week.
     *
     * @param int $userId
     * @return array
     */
    public function getWeeklyStats(int $userId): array
    {
        $startOfWeek = now()->startOfWeek();
        $endOfWeek = now()->endOfWeek();

        // Fetch daily stats for this week
        $dailyStats = DailyStat::query()->where('user_id', $userId)
            ->whereBetween('date', [$startOfWeek->toDateString(), $endOfWeek->toDateString()])
            ->get();

        // Calculate aggregates
        $totalFlowTime = $dailyStats->sum('flow_time_min');
        $totalDeepWorkBlocks = $dailyStats->sum('deep_work_blocks');
        $totalTasksCompleted = $dailyStats->sum('tasks_completed');
        $totalContextsSaved = $dailyStats->sum('contexts_saved');

        // Get previous week for comparison
        $startOfLastWeek = now()->subWeek()->startOfWeek();
        $endOfLastWeek = now()->subWeek()->endOfWeek();
        
        $lastWeekFlowTime = DailyStat::query()->where('user_id', $userId)
            ->whereBetween('date', [$startOfLastWeek->toDateString(), $endOfLastWeek->toDateString()])
            ->sum('flow_time_min');

        // Calculate flow time change percentage
        $flowTimeChange = 0;
        if ($lastWeekFlowTime > 0) {
            $flowTimeChange = round((($totalFlowTime - $lastWeekFlowTime) / $lastWeekFlowTime) * 100);
        } elseif ($totalFlowTime > 0) {
            $flowTimeChange = 100; // 100% increase if last week was 0
        }

        $currentStreak = $this->getCurrentStreak($userId);

        // Get weekly goal
        $user = User::query()->find($userId);
        $weeklyGoalMin = $user->weekly_goal_min;

        return [
            'flow_time_minutes' => $totalFlowTime,
            'deep_work_blocks' => $totalDeepWorkBlocks,
            'tasks_completed' => $totalTasksCompleted,
            'contexts_saved' => $totalContextsSaved,
            'flow_time_change_percent' => $flowTimeChange,
            'current_streak_days' => $currentStreak,
            'weekly_goal_minutes' => $weeklyGoalMin,
            'goal_progress_percent' => $weeklyGoalMin > 0 ? min(round(($totalFlowTime / $weeklyGoalMin) * 100), 100) : 0,
        ];
    }

    /**
     * Get daily breakdown for the current week (for charts).
     *
     * @param int $userId
     * @return array
     */
    public function getDailyBreakdown(int $userId): array
    {
        $startOfWeek = now()->startOfWeek();
        $endOfWeek = now()->endOfWeek();

        $dailyStats = DailyStat::query()->where('user_id', $userId)
            ->whereBetween('date', [$startOfWeek->toDateString(), $endOfWeek->toDateString()])
            ->get()
            ->keyBy('date');

        $breakdown = [];
        $currentDate = $startOfWeek->copy();

        while ($currentDate <= $endOfWeek) {
            $dateStr = $currentDate->toDateString();
            $statForDay = $dailyStats->first(fn($item) => $item->date->toDateString() === $dateStr);

            $breakdown[] = [
                'date' => $dateStr,
                'day_name' => $currentDate->format('D'), // Mon, Tue...
                'flow_time_minutes' => $statForDay ? $statForDay->flow_time_min : 0,
                'tasks_completed' => $statForDay ? $statForDay->tasks_completed : 0,
            ];

            $currentDate->addDay();
        }

        return $breakdown;
    }

    /**
     * Calculate current streak of days with at least one focus session.
     *
     * @param int $userId
     * @return int
     */
    public function getCurrentStreak(int $userId): int
    {
        $streak = 0;
        $checkDate = now();
        
        $hasWorkedToday = DailyStat::query()->where('user_id', '=', $userId)
            ->where('date', '=', $checkDate->toDateString())
            ->where('flow_time_min', '>', 0)
            ->exists();
            
        if ($hasWorkedToday) {
            $streak++;
            $checkDate->subDay();
        } else {
            // Check yesterday
            $checkDate->subDay();
            $hasWorkedYesterday = DailyStat::query()->where('user_id', '=', $userId)
            ->where('date', '=', $checkDate->toDateString())
            ->where('flow_time_min', '>', 0)
            ->exists();
            
            if (!$hasWorkedYesterday) {
                return 0; // Streak broken
            }
        }

        // Count backwards
        while (true) {
            $hasWorked = DailyStat::query()->where('user_id', '=', $userId)
                ->where('date', '=', $checkDate->toDateString())
                ->where('flow_time_min', '>', 0)
                ->exists();
                
            if ($hasWorked) {
                $streak++;
                $checkDate->subDay();
            } else {
                break;
            }
        }
        
        return $streak;
    }

    /**
     * Set the weekly flow time goal.
     *
     * @param int $userId
     * @param int $targetMinutes
     * @return void
     */
    public function setWeeklyGoal(int $userId, int $targetMinutes): void
    {
        $user = User::query()->find($userId);
        $user->weekly_goal_min = $targetMinutes;
        $user->save();
    }

    /**
     * Get AI productivity insights based on user data.
     *
     * @param int $userId
     * @return array
     */
    public function getProductivityInsights(int $userId): array
    {
        
        // Find best day of week
        $bestDayStats = DailyStat::query()->where('user_id', $userId)
            ->selectRaw('EXTRACT(DOW FROM date) as dow, AVG(flow_time_min) as avg_flow')
            ->groupBy('dow')
            ->orderByDesc('avg_flow')
            ->first();
            
        $bestDayName = $bestDayStats ? Carbon::create()->dayOfWeek($bestDayStats->dow)->format('l') : 'Unknown';
        
        $insights = [];
        
        if ($bestDayStats && $bestDayStats->avg_flow > 0) {
            $insights[] = [
                'type' => 'trend',
                'title' => 'Peak Performance',
                'description' => "You tend to be most productive on {$bestDayName}s.",
                'icon' => 'trending-up'
            ];
        }

        // Check if hitting goal
        $weeklyStats = $this->getWeeklyStats($userId);
        if ($weeklyStats['goal_progress_percent'] >= 80 && $weeklyStats['goal_progress_percent'] < 100) {
             $insights[] = [
                'type' => 'motivation',
                'title' => 'Almost There!',
                'description' => "You're at {$weeklyStats['goal_progress_percent']}% of your weekly goal. Keep pushing!",
                'icon' => 'target'
            ];
        } else if ($weeklyStats['goal_progress_percent'] >= 100) {
             $insights[] = [
                'type' => 'celebration',
                'title' => 'Goal Crushed!',
                'description' => "You've exceeded your weekly goal! Amazing work.",
                'icon' => 'award'
            ];
        }

        return $insights;
    }
}
