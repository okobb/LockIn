<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\IncomingMessage;
use App\Models\Integration;
use App\Services\IncomingMessageService;
use App\Services\TaskService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class ProcessIncomingMessageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public IncomingMessage $message
    ) {}

    public function handle(
        TaskService $taskService,
        IncomingMessageService $messageService
    ): void {
        if ($this->message->status !== 'pending') {
            return;
        }

        $payload = json_decode($this->message->content_raw, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $messageService->markAsFailed($this->message, 'Invalid JSON');
            return;
        }
        
        // Urgency Check
        $score = (float) ($payload['urgency_score'] ?? 0);
        if (isset($payload['urgency_score']) && $score < 0.4) {
            $messageService->markAsSkipped($this->message, 'Low urgency score (' . $score . ')');
            return;
        }

        // Find the id of the owner of this message
        $userId = $this->resolveUserId($payload);
        if ($userId) {
            $this->message->update(['user_id' => $userId]);
        }
        $user = $userId ? $this->message->user : null;

        // Create a task
        $task = $taskService->createFromWebhookPayload($payload, $user);

        $messageService->markAsProcessed($this->message, $task->id);
    }

    /**
     * Resolve user_id from the payload using the Integration table.
     */
    private function resolveUserId(array $payload): ?int
    {
        $provider = $payload['provider'] ?? $this->message->provider;
        $externalId = $payload['sender_id'] ?? $payload['external_id'] ?? null;

        if (!$provider || !$externalId) {
            return null;
        }

        $integration = Integration::where('provider', $provider)
            ->where('provider_id', $externalId)
            ->where('is_active', true)
            ->first();

        return $integration?->user_id;
    }
}