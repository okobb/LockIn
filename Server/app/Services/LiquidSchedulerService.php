<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CalendarEvent;
use App\Models\ReadLaterQueue;
use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Support\Collection;

final class LiquidSchedulerService
{
    /**
     * Get suggestions for today based on calendar gaps.
     */
    public function getTodaySuggestions(int $userId): array
    {
        $today = Carbon::today();
        $gaps = $this->findDailyGaps($userId, $today);
        $suggestions = [];

        foreach ($gaps as $gap) {
            $matches = $this->suggestContentForGap($userId, $gap['duration_minutes']);
            
            if ($matches->isNotEmpty()) {
                $suggestions[] = [
                    'gap' => $gap,
                    'items' => $matches,
                ];
            }
        }

        return $suggestions;
    }

    /**
     * Find available gaps in the user's schedule for a given day.
     * Returns gaps > 15 minutes.
     */
    public function findDailyGaps(int $userId, Carbon $date): Collection
    {
        $timeline = $this->getDailyTimeline($userId, $date);
        
        $startTime = $this->determineScanStartTime($date);
        $endTime = $date->copy()->setTime(22, 0); // End of day cutoff

        if ($startTime->gt($endTime)) {
            return collect();
        }

        return $this->calculateTimelineGaps($timeline, $startTime, $endTime);
    }

    /**
     * Find Read Later items that fit into a gap.
     * Strategy:
     * - Gap < 20 min: Short reads/videos
     * - Gap 20-45 min: Medium content
     * - Gap 45+ min: Deep reading/courses
     */
    public function suggestContentForGap(int $userId, int $minutes): Collection
    {
        return ReadLaterQueue::query()
            ->with(['resource'])
            ->where('user_id', $userId)
            ->where('is_completed', false)
            ->whereNull('scheduled_for')
            ->where(function($q) use ($minutes) {
                $q->whereNull('estimated_minutes')
                  ->orWhere('estimated_minutes', '<=', $minutes);
            })
            ->orderBy('estimated_minutes', 'desc')
            ->take(3)
            ->get();
    }

    private function getDailyTimeline(int $userId, Carbon $date): Collection
    {
        $events = CalendarEvent::query()
            ->where('user_id', $userId)
            ->whereDate('start_time', $date)
            ->orderBy('start_time')
            ->get();
            
        $tasks = Task::query()
            ->where('user_id', $userId)
            ->whereDate('scheduled_start', $date)
            ->whereNull('completed_at')
            ->orderBy('scheduled_start')
            ->get();

        return $events->concat($tasks)
            ->sortBy(fn($item) => $item->start_time ?? $item->scheduled_start)
            ->values();
    }

    private function determineScanStartTime(Carbon $date): Carbon
    {
        $now = now();
        $morningStart = $date->copy()->setTime(8, 0);

        if ($date->isToday()) {
            return $now->hour < 8 ? $morningStart : $now;
        }

        return $morningStart;
    }

    private function calculateTimelineGaps(Collection $timeline, Carbon $currentTime, Carbon $endOfDay): Collection
    {
        $gaps = collect();

        foreach ($timeline as $item) {
            $start = $item->start_time ?? $item->scheduled_start;
            
            $estimatedDuration = $item->estimated_minutes ?? 30;
            $end = $item->end_time ?? $item->scheduled_end ?? $start->copy()->addMinutes($estimatedDuration);

            if ($end->lt($currentTime)) {
                continue;
            }

            if ($start->gt($currentTime)) {
                $this->addGapIfValid($gaps, $currentTime, $start);
            }

            $currentTime = $end->copy(); 
        }

        if ($currentTime->lt($endOfDay)) {
             $this->addGapIfValid($gaps, $currentTime, $endOfDay, 'End of day free time');
        }

        return $gaps;
    }

    private function addGapIfValid(Collection $gaps, Carbon $start, Carbon $end, ?string $description = null): void
    {
        $minutes = $start->diffInMinutes($end, false);
        
        if ($minutes >= 15) {
            $gaps->push([
                'start' => $start->format('H:i'),
                'end' => $end->format('H:i'),
                'duration_minutes' => (int) $minutes,
                'description' => $description ?? $this->getGapDescription((int) $minutes),
            ]);
        }
    }

    private function getGapDescription(int $minutes): string
    {
        return match(true) {
            $minutes < 20 => 'Quick Break',
            $minutes < 60 => 'Free Block',
            default => 'Deep Work Session',
        };
    }
}
