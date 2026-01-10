<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exceptions\ServiceException;
use App\Models\Integration;
use App\Services\GmailService;
use App\Services\GoogleCalendarService;
use App\Services\IntegrationService;
use App\Services\SlackService;
use Illuminate\Http\JsonResponse;

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
        private readonly SlackService $slackService
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
     * Fetch Gmail messages for a specific user.
     */
    public function syncGmail(int $userId): JsonResponse
    {
        try {
            $messages = $this->gmailService->fetchRecentMessages($userId, 20);

            return $this->successResponse([
                'user_id' => $userId,
                'count' => count($messages),
                'messages' => $messages,
            ]);
        } catch (ServiceException $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode());
        }
    }

    /**
     * Fetch Slack messages for a specific user.
     */
    public function syncSlack(int $userId): JsonResponse
    {
        try {
            $messages = $this->slackService->fetchRecentMessages($userId);

            return $this->successResponse([
                'user_id' => $userId,
                'count' => count($messages),
                'messages' => $messages,
            ]);
        } catch (ServiceException $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode());
        }
    }
}
