<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CalendarEvent;
use App\Models\ReadLaterQueue;
use App\Models\Task;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Collection;

final class LiquidSchedulerService
{
    public function __construct(
        private AIService $aiService
    ) {}

    /**
     * Get suggestions for today based on calendar gaps.
     */
    public function getTodaySuggestions(int $userId): array
    {
        $today = Carbon::today();
        $gaps = $this->findDailyGaps($userId, $today);
        $suggestions = [];

        foreach ($gaps as $gap) {
            $matches = $this->suggestContentForGap($userId, $gap['duration_minutes'], $gap['next_event'] ?? null);
            
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
     */
    public function suggestContentForGap(int $userId, int $minutes, ?string $nextEvent = null): Collection
    {
        $candidates = ReadLaterQueue::query()
            ->with(['resource'])
            ->where('user_id', $userId)
            ->where('is_completed', false)
            ->whereNull('scheduled_for')
            ->where(function($q) use ($minutes) {
                $q->whereNull('estimated_minutes')
                  ->orWhere('estimated_minutes', '<=', $minutes);
            })
            ->orderBy('id', 'desc') // Recent first
            ->take(10)
            ->get();

        if ($candidates->isEmpty()) {
            return collect();
        }

        if (!$nextEvent) {
             return $candidates->take(3);
        }
        $simplifiedResources = $candidates->map(fn($item) => [
            'id' => $item->id,
            'title' => $item->resource->title,
            'type' => $item->resource->type,
            'estimated_minutes' => $item->estimated_minutes ?? $item->resource->estimated_time_minutes ?? 15,
            'tags' => $item->resource->tags ?? [],
        ])->toJson();

        try {
            $result = $this->aiService->getLiquidSuggestion($minutes, $nextEvent, $simplifiedResources);
            $selectedId = $result['selected_id'] ?? null;

            if ($selectedId) {
                return $candidates->where('id', $selectedId)->values();
            }

            return collect();

        } catch (Exception $e) {
            return $candidates->take(1);
        }
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
                $nextEventContext = $item->title ?? 'Unknown Event';
                $this->addGapIfValid($gaps, $currentTime, $start, null, $nextEventContext);
            }

            $currentTime = $end->copy(); 
        }

        if ($currentTime->lt($endOfDay)) {
             $this->addGapIfValid($gaps, $currentTime, $endOfDay, 'End of day free time', 'End of Day');
        }

        return $gaps;
    }

    private function addGapIfValid(Collection $gaps, Carbon $start, Carbon $end, ?string $description = null, ?string $nextEvent = null): void
    {
        $minutes = $start->diffInMinutes($end, false);
        
        if ($minutes >= 15) {
            $gaps->push([
                'start' => $start->format('H:i'),
                'start_iso' => $start->toIso8601String(),
                'end' => $end->format('H:i'),
                'end_iso' => $end->toIso8601String(),
                'duration_minutes' => (int) $minutes,
                'description' => $description ?? $this->getGapDescription((int) $minutes),
                'next_event' => $nextEvent,
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
