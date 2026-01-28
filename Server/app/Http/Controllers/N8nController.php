<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exceptions\ServiceException;
use App\Http\Requests\N8n\HandleProcessedMessageRequest;
use App\Models\IncomingMessage;
use App\Models\Integration;
use App\Services\GmailService;
use App\Services\GoogleCalendarService;
use App\Services\GitHubService;
use App\Services\IncomingMessageService;
use App\Services\IntegrationService;
use App\Services\SlackService;
use App\Services\TaskService;
use Exception;
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
        private readonly GitHubService $gitHubService,
        private readonly IncomingMessageService $incomingMessageService,
        private readonly TaskService $taskService
    ) {}

    /**
     * Get all users with active integrations.
     */
    public function activeIntegrations(): JsonResponse
    {
        $integrations = $this->integrationService->getAllActiveGroupedByUser();

        return $this->successResponse($integrations);
    }

    /**
     * Sync calendar events for a specific user.
     */
    public function syncCalendar(int $userId): JsonResponse
    {
        set_time_limit(300);
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
     * Sync GitHub PRs and create tasks for review requests.
     */
    public function syncGitHub(int $userId): JsonResponse
    {
        try {
            $result = $this->gitHubService->syncAndCreateTasksFromPRs($userId, $this->taskService);

            return $this->successResponse([
                'user_id' => $userId,
                'synced' => $result['synced'],
                'tasks' => $result['tasks'],
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
        $messages = $this->incomingMessageService->getPendingMessagesForAI();

        return $this->successResponse($messages);
    }

    /**
     * Handle AI-processed message: create task and mark message as processed.
     */
    public function handleProcessedMessage(HandleProcessedMessageRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {

            $result = $this->incomingMessageService->processMessage(
                $validated['message_id'],
                $validated,
                $this->taskService
            );

            return $this->successResponse($result);
        } catch (ServiceException $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode());
        } catch (Exception $e) {
            return $this->errorResponse('Failed to process message: ' . $e->getMessage(), 500);
        }
    }
}

