<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ServiceException;
use App\Models\IncomingMessage;
use Illuminate\Support\Collection;

/**
 * @extends BaseService<IncomingMessage>
 */
final class IncomingMessageService extends BaseService
{
    protected function getModelClass(): string
    {
        return IncomingMessage::class;
    }

    /**
     * Custom method to store raw webhook data safely.
     */
    public function storeRawPayload(array $payload, string $source, int $userId, ?string $ip = null): IncomingMessage
    {
        return $this->create([
            'user_id'       => $userId,
            'content_raw'   => json_encode($payload),
            'provider'      => $source,
            'external_id'   => $payload['external_id'] ?? null,
            'sender_info'   => $payload['sender'] ?? 'unknown',
            'channel_info'  => $payload['channel'] ?? 'webhook',
            'urgency_score' => (float) ($payload['urgency_score'] ?? 0),
            'extracted_action' => $payload['action'] ?? $payload['extracted_action'] ?? null,
            'was_allowed'   => true,
            'status'        => 'pending',
            'received_at'   => now(),
        ]);
    }

    public function markAsProcessed(IncomingMessage $message, int $taskId): void
    {
        $this->update($message->id, [
            'status' => 'processed',
            'extracted_task_id' => $taskId,
        ]);
    }

    public function markAsSkipped(IncomingMessage $message, string $reason): void
    {
        $this->update($message->id, [
            'status' => 'skipped',
            'decision_reason' => $reason,
        ]);
    }

    public function markAsFailed(IncomingMessage $message, string $reason): void
    {
        $this->update($message->id, [
            'status' => 'failed',
            'decision_reason' => $reason,
        ]);
    }

    /**
     * Get all pending messages formatted for AI processing.
     */
    public function getPendingMessagesForAI(): Collection
    {
        return IncomingMessage::query()
            ->where('status', '=', 'pending')
            ->select(['id', 'user_id', 'provider', 'external_id', 'content_raw', 'sender_info', 'channel_info', 'created_at'])
            ->get()
            ->map(fn ($m) => [
                'message_id' => $m->id,
                'user_id' => $m->user_id,
                'provider' => $m->provider,
                'external_id' => $m->external_id,
                'content' => $m->content_raw,
                'sender' => $m->sender_info,
                'channel' => $m->channel_info,
                'received_at' => $m->created_at?->toIso8601String(),
            ]);
    }
    
    /**
     * Process an incoming message: either skip it or create a task from it.
     */
    public function processMessage(int $messageId, array $data, TaskService $taskService): array
    {
        $message = IncomingMessage::with('user')->findOrFail($messageId);
        
        $this->validateProcessingState($message);

        if (($data['action'] ?? '') === 'ignore') {
            return $this->handleIgnoreAction($message, $data);
        }

        return $this->createTaskForMessage($message, $data, $taskService);
    }

    private function validateProcessingState(IncomingMessage $message): void
    {
        if ($message->status !== 'pending') {
            throw new ServiceException(
                "Message {$message->id} has already been processed (status: {$message->status})",
                400
            );
        }
    }

    private function handleIgnoreAction(IncomingMessage $message, array $data): array
    {
        $this->markAsSkipped(
            $message,
            $data['reasoning'] ?? 'AI suggested ignoring this message.'
        );

        return [
            'status' => 'skipped',
            'message' => 'Message skipped (no task created)'
        ];
    }

    private function createTaskForMessage(IncomingMessage $message, array $data, TaskService $taskService): array
    {
        if (!$message->user) {
            throw new ServiceException(
                "Message {$message->id} has no associated user",
                400
            );
        }

        $task = $taskService->createFromWebhookPayload([
            'title' => $data['title'] ?? 'Untitled Task',
            'priority' => $data['priority'] ?? 'normal',
            'description' => $data['description'] ?? '',
            'source_type' => $message->provider,
            'source_link' => $message->external_id,
            'due_date' => $data['due_date'] ?? null,
            'estimated_minutes' => $data['estimated_minutes'] ?? null,
            'ai_reasoning' => $data['reasoning'] ?? null,
        ], $message->user);

        $this->markAsProcessed($message, $task->id);

        return [
            'message_id' => $message->id,
            'task_id' => $task->id,
            'task_title' => $task->title,
            'status' => 'processed',
        ];
    }
}