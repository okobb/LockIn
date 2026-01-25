<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\DailyStat;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Log;
use App\Traits\CachesData;

/**
 * @extends BaseService<Task>
 */
final class TaskService extends BaseService
{
    use CachesData;

    protected function getModelClass(): string
    {
        return Task::class;
    }

    /**
     * Get tasks for a user with optional filters.
     */
    public function getForUser(int $userId, ?string $status = 'open', ?string $scheduled = null): Collection
    {
        $query = Task::query()->where('user_id', '=', $userId);


        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if ($scheduled === 'true') {
            $query->whereNotNull('scheduled_start');
        } elseif ($scheduled === 'false') {
            $query->whereNull('scheduled_start');
        }

        return $query->with('focusSessions')
            ->orderByRaw('priority ASC')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get task suggestions for autocomplete.
     */
    public function getSuggestions(int $userId, ?string $query, int $limit = 10): Collection
    {
        return Task::query()->where('user_id', '=', $userId)
            ->where('status', '=', 'open')
            ->when($query, function ($q) use ($query, $userId) {

                $q->where('title', 'ILIKE', '%' . $query . '%');
            })

            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get(['id', 'title']);
    }

    /**
     * Create a new task for a user.
     */
    public function createForUser(int $userId, array $data): Task
    {
        $taskData = [
            'user_id' => $userId,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'priority' => $this->resolvePriority(['priority_label' => $data['priority_label'] ?? 'normal']),
            'status' => $data['status'] ?? 'open',
            'due_date' => $data['due_date'] ?? null,
            'estimated_minutes' => $data['estimated_minutes'] ?? null,
            'scheduled_start' => $data['scheduled_start'] ?? null,
            'scheduled_end' => $data['scheduled_end'] ?? null,
        ];

        return $this->create($taskData);
    }

    public function updateTask(Task $task, array $data): Task
    {
        if (isset($data['status']) && $data['status'] === 'done' && $task->status !== 'done') {
            $data['completed_at'] = now();
            
            // Increment daily stats
           DailyStat::query()->updateOrCreate(
                ['user_id' => $task->user_id, 'date' => now()->toDateString()],
                ['tasks_completed' => \Illuminate\Support\Facades\DB::raw('tasks_completed + 1')]
            );
        }

        $task->update($data);
        Log::info('Task updated', ['task_id' => $task->id, 'data' => $data]);
        $this->clearUserDashboardCache($task->user_id);

        return $task->fresh();
    }

    /**
     * Create a task from a webhook payload.
     */
    public function createFromWebhookPayload(array $payload, ?User $user = null): Task
    {
        return $this->executeInTransaction(function () use ($payload, $user) {
            $data = [
                'user_id'           => $user?->id, 
                'title'             => $payload['title'] ?? 'Untitled Task',
                'description'       => $this->formatDescription($payload),
                'priority'          => $this->resolvePriority($payload),
                'source_type'       => $payload['source_type'] ?? 'api',
                'source_link'       => $payload['source_link'] ?? null,
                'source_metadata'   => $payload, 
                'status'            => 'open',  
                'received_at'       => now(),
                'external_id'       => $payload['external_id'] ?? null,
                'ai_reasoning'      => $payload['ai_reasoning'] ?? null,
                'due_date'          => $payload['due_date'] ?? null,
                'estimated_minutes' => $payload['estimated_minutes'] ?? null,
                'scheduled_start'   => $payload['start_date'] ?? $payload['scheduled_start'] ?? null,
                'scheduled_end'     => $payload['end_date'] ?? $payload['scheduled_end'] ?? null,
            ];

            return $this->create($data);
        });
    }

    /**
     * Map priority label string to integer.
     */
    /**
     * Resolve priority from payload.
     */
    private function resolvePriority(array $payload): int
    {
        if (isset($payload['urgency_score'])) {
            $score = (float) $payload['urgency_score'];
            
            if ($score >= 0.8) return PRIORITY_CRITICAL;
            if ($score >= 0.6) return PRIORITY_HIGH;
            if ($score >= 0.4) return PRIORITY_NORMAL;
            return PRIORITY_LOW;
        }

        $label = strtolower($payload['priority'] ?? $payload['priority_label'] ?? 'normal');

        return match ($label) {
            'urgent', 'critical' => PRIORITY_CRITICAL,
            'high' => PRIORITY_HIGH,
            'normal', 'medium' => PRIORITY_NORMAL,
            'low' => PRIORITY_LOW,
            default => PRIORITY_NORMAL,
        };
    }

    /**
     * Helper to format the description block.
     */
    private function formatDescription(array $payload): string
    {
        $body = $payload['description'] ?? '';
        $aiAnalysis = $payload['ai_reasoning'] ?? $payload['reasoning'] ?? $payload['ai_analysis'] ?? null;

        $output = $body;

        if ($aiAnalysis) {
            $output .= "\n\n--- AI Analysis ---\n{$aiAnalysis}";
        }

        return $output;
    }



    /**
     * Delete a task and invalidate cache.
     */
    public function deleteTask(Task $task): void
    {
        $task->delete();
        $this->clearUserDashboardCache($task->user_id);
    }
}