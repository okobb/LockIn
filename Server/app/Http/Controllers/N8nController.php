<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exceptions\ServiceException;
use App\Models\IncomingMessage;
use App\Models\Integration;
use App\Services\GmailService;
use App\Services\GoogleCalendarService;
use App\Services\IncomingMessageService;
use App\Services\IntegrationService;
use App\Services\SlackService;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controller for n8n API endpoints.
 * These endpoints are called by n8n workflows to sync data.
 */
final class N8nController extends BaseController
{
    public function __construct(
        private readonly IntegrationService $integrationService,
        private readonly GoogleCalendarService $googleCalendarService,
        private readonly GmailService $gmailService,
        private readonly SlackService $slackService,
        private readonly IncomingMessageService $incomingMessageService,
        private readonly TaskService $taskService
    ) {}

    /**
     * Get all users with active integrations.
     */
    public function activeIntegrations(): JsonResponse
    {
        $integrations = Integration::where('is_active', true)
            ->select(['user_id', 'provider', 'provider_id', 'scopes'])
            ->get()
            ->groupBy('user_id')
            ->map(fn ($userIntegrations) => [
                'user_id' => $userIntegrations->first()->user_id,
                'integrations' => $userIntegrations->map(fn ($i) => [
                    'provider' => $i->provider,
                    'provider_id' => $i->provider_id,
                    'scopes' => $i->scopes,
                ])->values(),
            ])
            ->values();

        return $this->successResponse($integrations);
    }

    /**
     * Sync calendar events for a specific user.
     */
    public function syncCalendar(int $userId): JsonResponse
    {
        try {
            $result = $this->googleCalendarService->syncEventsForUser($userId);

            return $this->successResponse([
                'user_id' => $userId,
                'synced' => $result['synced'],
                'events' => $result['events']->map(fn ($e) => [
                    'id' => $e->id,
                    'external_id' => $e->external_id,
                    'title' => $e->title,
                    'start_time' => $e->start_time,
                    'end_time' => $e->end_time,
                ])->toArray(),
            ]);
        } catch (ServiceException $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode());
        }
    }

    /**
     * Fetch and store Gmail messages for a specific user.
     */
    public function syncGmail(int $userId): JsonResponse
    {
        try {
            $storedMessages = $this->gmailService->syncAndStoreMessages($userId, 20);

            return $this->successResponse([
                'user_id' => $userId,
                'synced' => $storedMessages->count(),
                'messages' => $storedMessages->map(fn ($m) => [
                    'id' => $m->id,
                    'external_id' => $m->external_id,
                    'sender' => $m->sender_info,
                    'status' => $m->status,
                ])->toArray(),
            ]);
        } catch (ServiceException $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode());
        }
    }

    /**
     * Fetch and store Slack messages for a specific user.
     */
    public function syncSlack(int $userId): JsonResponse
    {
        try {
            $storedMessages = $this->slackService->syncAndStoreMessages($userId);

            return $this->successResponse([
                'user_id' => $userId,
                'synced' => $storedMessages->count(),
                'messages' => $storedMessages->map(fn ($m) => [
                    'id' => $m->id,
                    'external_id' => $m->external_id,
                    'channel' => $m->channel_info,
                    'status' => $m->status,
                ])->toArray(),
            ]);
        } catch (ServiceException $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode());
        }
    }

    /**
     * Get all unprocessed messages for AI processing.
     */
    public function unprocessedMessages(): JsonResponse
    {
        $messages = IncomingMessage::where('status', 'pending')
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

        return $this->successResponse($messages);
    }

    /**
     * Handle AI-processed message: create task and mark message as processed.
     */
    public function handleProcessedMessage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message_id' => 'required|integer|exists:incoming_messages,id',
            'title' => 'required|string|max:255',
            'priority' => 'nullable|string|in:low,normal,medium,high,urgent,critical',
            'summary' => 'nullable|string',
            'due_date' => 'nullable|date',
        ]);

        try {
            $message = IncomingMessage::findOrFail($validated['message_id']);

            // Check if already processed
            if ($message->status !== 'pending') {
                return $this->errorResponse(
                    "Message {$validated['message_id']} has already been processed (status: {$message->status})",
                    400
                );
            }

            // Create task from AI output
            $task = $this->taskService->createFromWebhookPayload([
                'title' => $validated['title'],
                'priority' => $validated['priority'] ?? 'normal',
                'description' => $validated['summary'] ?? '',
                'source' => $message->provider,
                'external_id' => $message->external_id,
                'due_date' => $validated['due_date'] ?? null,
            ], $message->user);

            // Mark message as processed
            $this->incomingMessageService->markAsProcessed($message, $task->id);

            return $this->successResponse([
                'message_id' => $message->id,
                'task_id' => $task->id,
                'task_title' => $task->title,
                'status' => 'processed',
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to process message: ' . $e->getMessage(), 500);
        }
    }
}

