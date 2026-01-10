<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\IncomingMessage;

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
    public function storeRawPayload(array $payload, string $source, ?string $ip = null): IncomingMessage
    {
        return $this->create([
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
}