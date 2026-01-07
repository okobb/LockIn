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
                'user_id'           => $user?->id, // Nullable if system task
                'title'             => $payload['title'] ?? 'Untitled Task',
                'description'       => $this->formatDescription($payload),
                'priority'          => $this->mapPriority($payload['priority'] ?? 'normal'),
                'source_type'       => $payload['source'] ?? 'api',
                'source_metadata'   => $payload, // Save raw data for debugging
                'status'            => 'open',   // Default state
                'received_at'       => now(),
            ];

            // 2. Use the parent create() method which handles the DB insert
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

        $output = "From: {$sender}\n\n{$body}";

        if ($aiAnalysis) {
            $output .= "\n\n--- AI Analysis ---\n{$aiAnalysis}";
        }

        return $output;
    }

    /**
     * Map string priorities to your integer database column
     */
    private function mapPriority(string $priority): int
    {
        return match (strtolower($priority)) {
            'urgent', 'critical' => 1, // High
            'high' => 2,
            'normal', 'medium' => 3,
            'low' => 4,
            default => 3,
        };
    }
}