<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

/**
 * @extends BaseService<Task>
 */
final class TaskService extends BaseService
{
    protected function getModelClass(): string
    {
        return Task::class;
    }

    /**
     * Get tasks for a user with optional filters.
     */
    public function getForUser(int $userId, ?string $status = 'open', ?string $scheduled = null): Collection
    {
        $query = Task::where('user_id', $userId);

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if ($scheduled === 'true') {
            $query->whereNotNull('scheduled_start');
        } elseif ($scheduled === 'false') {
            $query->whereNull('scheduled_start');
        }

        return $query->orderByRaw('priority ASC')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get task suggestions for autocomplete.
     */
    public function getSuggestions(int $userId, ?string $query, int $limit = 10): Collection
    {
        return Task::where('user_id', $userId)
            ->where('status', 'open')
            ->when($query, function ($q) use ($query) {
                $q->where('title', 'ilike', '%' . $query . '%');
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
            'priority' => $this->mapPriorityLabelToInt($data['priority_label'] ?? 'normal'),
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
        }

        $task->update($data);

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
                'priority'          => $this->mapPriority($payload),
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
    private function mapPriorityLabelToInt(string $label): int
    {
        return match (strtolower($label)) {
            'critical' => 1,
            'high' => 2,
            'normal', 'medium' => 3,
            'low' => 4,
            default => 3,
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
     * Map priority from urgency_score or string.
     */
    private function mapPriority(array $payload): int
    {
        if (isset($payload['urgency_score'])) {
            $score = (float) $payload['urgency_score'];
            
            if ($score >= 0.8) return 1;
            if ($score >= 0.6) return 2;
            if ($score >= 0.4) return 3;
            return 4;
        }

        $priority = strtolower($payload['priority'] ?? 'normal');

        return match ($priority) {
            'urgent', 'critical' => 1,
            'high' => 2,
            'normal', 'medium' => 3,
            'low' => 4,
            default => 3,
        };
    }
}