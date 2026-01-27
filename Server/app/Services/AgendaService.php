<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CalendarEvent;
use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

final class AgendaService
{
    /**
     * Get a unified agenda for the dashboard.
     * 
     * @return Collection<int, array>
     */
    public function getUnifiedAgenda(int $userId, int $limit = 5): Collection
    {
        return Cache::remember("dashboard:agenda:{$userId}", now()->addMinutes(1), function () use ($userId, $limit) {
            
            $events = CalendarEvent::query()
                ->where('user_id', '=', $userId, 'and')
                ->whereDate('start_time', Carbon::today())
                ->where('start_time', '>=', now())
                ->get();

            $tasks = Task::query()
                ->where('user_id', '=', $userId, 'and')
                ->whereIn('status', ['open', 'in_progress'])
                ->where(function($q) {
                    $q->whereDate('scheduled_start', Carbon::today())
                      ->orWhereDate('due_date', Carbon::today());
                })
                ->whereNull('completed_at')
                ->get();
                
            return $events->concat($tasks)
                ->sortBy(fn($item) => $this->getItemStartTime($item))
                ->take($limit)
                ->map(fn($item) => $this->formatAgendaItem($item))
                ->values();
        });
    }

    private function getItemStartTime($item): ?Carbon
    {
        if ($item instanceof Task) {
             return $item->scheduled_start ?? $item->due_date?->startOfDay();
        }
        return $item->start_time;
    }

    private function formatAgendaItem($item): array
    {
        $isTask = $item instanceof Task;
        $startTime = $this->getItemStartTime($item);
        
        $timeString = $startTime?->format('H:i') ?? 'Anytime';
        
        if ($isTask && !$item->scheduled_start && $item->due_date) {
            $timeString = 'Anytime';
        }

        return [
            'id' => (string) $item->id,
            'type' => $isTask ? 'task' : $this->mapEventType($item->type),
            'itemType' => $isTask ? 'task' : 'event',
            'taskId' => $isTask ? (string) $item->id : (($item->metadata ?? [])['task_id'] ?? null),
            'time' => $timeString,
            'title' => $item->title,
            'meta' => $isTask 
                ? ($item->estimated_minutes ? "{$item->estimated_minutes} min" : 'Task')
                : Carbon::parse($item->start_time)->diffInMinutes(Carbon::parse($item->end_time)) . ' min',
        ];
    }
    
    private function mapEventType(?string $type): string
    {
        return match ($type) {
            'deep_work' => 'focus',
            'meeting' => 'meeting',
            'external' => 'external',
            default => 'focus',
        };
    }
}
