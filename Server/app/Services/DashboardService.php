<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CalendarEvent;
use App\Models\IncomingMessage;
use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class DashboardService
{
    /**
     * Get dashboard statistics for a user.
     *
     * @return array<string, mixed>
     */
    public function getStats(int $userId): array
    {
        return Cache::remember("dashboard:stats:{$userId}", now()->addMinutes(2), function () use ($userId) {
            $today = Carbon::today();

            $tasksDone = Task::query()
                ->where('user_id', '=', $userId)
                ->where('status', '=', 'done')
                ->whereDate('completed_at', $today)
                ->count();

            $deepWorkBlocks = CalendarEvent::query()
                ->where('user_id', '=', $userId)
                ->where('type', '=', 'deep_work')
                ->whereDate('start_time', $today)
                ->count();

            $deepWorkMinutes = $this->calculateDeepWorkMinutes($userId, $today);

            $hours = floor($deepWorkMinutes / 60);
            $minutes = $deepWorkMinutes % 60;

            return [
                'flowTime' => "{$hours}h {$minutes}m",
                'contextsSaved' => 0,
                'deepWorkBlocks' => $deepWorkBlocks,
                'tasksDone' => $tasksDone,
            ];
        });
    }

    /**
     * Get priority tasks for a user.
     */
    public function getPriorityTasks(int $userId, int $limit = 5): Collection
    {
        return Task::query()
            ->where('user_id', '=', $userId)
            ->whereIn('status', ['open', 'in_progress'])
            ->where('priority', '<=', 2)
            ->orderBy('priority', 'asc')
            ->orderBy('created_at', 'desc')
            ->with('incomingMessages')
            ->limit($limit)
            ->get()
            ->map(fn(Task $task) => [
                'id' => (string) $task->id,
                'title' => $task->title,
                'tag' => $this->mapSourceToTag($task->source_type),
                'tagColor' => $this->mapPriorityToColor($task->priority),
                'reference' => $this->extractSender($task),
                'reason' => $task->ai_reasoning ?? 'High priority task',
                'timeAgo' => $task->created_at->diffForHumans(),
            ]);
    }

    /**
     * Get upcoming events for a user.
     */
    public function getUpcomingEvents(int $userId, int $limit = 5): Collection
    {
        return Cache::remember("dashboard:events:{$userId}", now()->addMinutes(1), function () use ($userId, $limit) {
            return CalendarEvent::query()
                ->where('user_id', '=', $userId)
                ->whereDate('start_time', Carbon::today())
                ->where('start_time', '>=', now())
                ->orderBy('start_time')
                ->limit($limit)
                ->get()
                ->map(fn($event) => [
                    'id' => (string) $event->id,
                    'time' => Carbon::parse($event->start_time)->format('H:i'),
                    'title' => $event->title,
                    'meta' => Carbon::parse($event->start_time)->diffInMinutes(Carbon::parse($event->end_time)) . ' min',
                    'type' => $this->mapEventType($event->type),
                ]);
        });
    }

    /**
     * Get recent communications for a user.
     */
    public function getCommunications(int $userId, int $limit = 5): Collection
    {
        return IncomingMessage::query()
            ->where('user_id', '=', $userId)
            ->whereIn('status', ['pending', 'processed'])
            ->orderBy('urgency_score', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(fn($msg) => [
                'id' => (string) $msg->id,
                'source' => $this->mapProviderToSource($msg->provider),
                'author' => $msg->sender_info ?? 'Unknown',
                'channel' => $msg->channel_info,
                'message' => Str::limit($msg->content_raw, 100),
                'timeAgo' => $msg->created_at->diffForHumans(),
                'isUrgent' => ($msg->urgency_score ?? 0) >= 0.7,
            ]);
    }

    /**
     * Calculate total deep work minutes for a user on a given day.
     */
    private function calculateDeepWorkMinutes(int $userId, Carbon $date): int
    {
        return (int) CalendarEvent::query()
            ->where('user_id', '=', $userId)
            ->where('type', '=', 'deep_work')
            ->whereDate('start_time', $date)
            ->sum(DB::raw('EXTRACT(EPOCH FROM (end_time - start_time)) / 60'));
    }

    private function mapSourceToTag(?string $source): string
    {
        return match ($source) {
            'gmail' => 'Email',
            'slack' => 'Slack',
            'github' => 'GitHub',
            'n8n' => 'Automation',
            default => 'Task',
        };
    }

    private function mapPriorityToColor(int $priority): string
    {
        return match ($priority) {
            1 => 'red',
            2 => 'yellow',
            3 => 'blue',
            4 => 'green',
            default => 'blue',
        };
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

    private function mapProviderToSource(string $provider): string
    {
        return match ($provider) {
            'gmail' => 'email',
            'slack' => 'slack',
            'github' => 'pr',
            default => 'email',
        };
    }

    /**
     * Extract sender info from task metadata or related message.
     */
    private function extractSender(Task $task): ?string
    {
        $sender = null;

        // Try to get sender from source_metadata
        $metadata = $task->source_metadata;
        if (is_array($metadata)) {
            // Check common sender fields
            $sender = $metadata['sender_info'] 
                ?? $metadata['sender'] 
                ?? $metadata['from'] 
                ?? $metadata['author'] 
                ?? null;
        }

        // Fallback: try to get from related incoming message
        if (!$sender) {
            $message = $task->incomingMessages->first();
            if ($message && $message->sender_info) {
                $sender = $message->sender_info;
            }
        }

        // Clean up email format: "Name <email>" → "Name"
        return $sender ? $this->formatSender($sender) : null;
    }

    /**
     * Format sender string for clean display.
     * Extracts name from "Name <email>" format, leaves other formats unchanged.
     */
    private function formatSender(string $sender): string
    {
        // Pattern: "Name <email@domain.com>" → extract "Name"
        if (preg_match('/^(.+?)\s*<[^>]+>$/', $sender, $matches)) {
            $name = trim($matches[1]);
            if (!empty($name)) {
                return $name;
            }
        }

        // Return as-is for Slack usernames, GitHub handles, etc.
        return $sender;
    }
}
