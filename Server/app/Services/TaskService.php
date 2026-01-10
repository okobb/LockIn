<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Task;
use App\Models\User;
use App\Services\BaseService;

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
     * Specialized method to handle the business logic of creating a task
     * from an incoming webhook payload.
     *
     * @param array $payload The raw payload from n8n
     * @param User|null $user The owner of the task (optional default)
     */
    public function createFromWebhookPayload(array $payload, ?User $user = null): Task
    {
        return $this->executeInTransaction(function () use ($payload, $user) {
            // 1. Map n8n keys to your Database Columns
            $data = [
                'user_id'           => $user?->id, 
                'title'             => $payload['title'] ?? 'Untitled Task',
                'description'       => $this->formatDescription($payload),
                'priority'          => $this->mapPriority($payload),
                'source_type'       => $payload['source'] ?? 'api',
                'source_metadata'   => $payload, 
                'status'            => 'open',  
                'received_at'       => now(),
                'external_id'       => $payload['external_id'] ?? null,
                'ai_reasoning'      => $payload['reasoning'] ?? $payload['ai_analysis'] ?? null,
                'due_date'          => $payload['due_date'] ?? null,
                'estimated_minutes' => $payload['estimated_minutes'] ?? null,
                'scheduled_start'   => $payload['start_date'] ?? $payload['scheduled_start'] ?? null,
                'scheduled_end'     => $payload['end_date'] ?? $payload['scheduled_end'] ?? null,
            ];

            return $this->create($data);
        });
    }

    /**
     * Helper to format the description block
     */
    private function formatDescription(array $payload): string
    {
        $sender = $payload['sender'] ?? 'Unknown';
        $body = $payload['description'] ?? '';
        $aiAnalysis = $payload['reasoning'] ?? $payload['ai_analysis'] ?? null;

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
            
            if ($score >= 0.8) return 1; // Critical
            if ($score >= 0.6) return 2; // High
            if ($score >= 0.4) return 3; // Normal
            return 4; // Low
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