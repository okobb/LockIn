<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ServiceException;
use App\Models\CalendarEvent;
use App\Models\Integration;
use App\Services\Traits\UsesIntegrationTokens;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

require_once __DIR__ . '/../consts.php';

/**
 * Service for interacting with Google Calendar API.
 */
final class GoogleCalendarService
{
    use UsesIntegrationTokens;

    public function __construct(
        private readonly IntegrationService $integrationService,
        private readonly CalendarEventService $calendarEventService
    ) {}

    /**
     * Sync calendar events for a user.
     *
     * @return array{synced: int, events: Collection<int, CalendarEvent>}
     * @throws ServiceException
     */
    public function syncEventsForUser(int $userId): array
    {
        $integration = $this->integrationService->getActiveIntegration($userId, 'google');

        if ($integration === null) {
            throw new ServiceException(
                message: 'Google Calendar not connected',
                code: 400
            );
        }

        // Check if calendar scope is available
        $scopes = $integration->scopes ?? [];
        $hasCalendarScope = collect($scopes)->contains(fn ($scope) => 
            str_contains($scope, 'calendar')
        );

        if (!$hasCalendarScope) {
            throw new ServiceException(
                message: 'Google Calendar scope not authorized. Please reconnect with calendar permissions.',
                code: 403
            );
        }

        $integration = $this->integrationService->refreshTokenIfExpired($integration);

        try {
            $googleEvents = $this->fetchEvents($integration);
        } catch (ServiceException $e) {
            // Check for missing scopes error from Google
            if ($e->getCode() === 403 && stripos($e->getMessage(), 'insufficient authentication scopes') !== false) {
                throw new ServiceException(
                    message: "Google Permission Error: Your connection is missing 'Calendar' access. Please go to Settings and click 'Connect Calendar' to upgrade your permissions.",
                    code: 403
                );
            }
            throw $e;
        }

        $syncedEventsCount = 0;
    
        // Get all dismissed external IDs for this user
        $dismissedExternalIds = CalendarEvent::query()
            ->where('user_id', $userId)
            ->whereBoolean('is_dismissed', true)
            ->whereNotNull('external_id')
            ->pluck('external_id')
            ->toArray();

        // Filter out dismissed events
        $eventsToSync = collect($googleEvents)->filter(function ($event) use ($dismissedExternalIds) {
            $externalId = $event['id'] ?? null;
            return $externalId && !in_array($externalId, $dismissedExternalIds);
        })->values()->all();

        if (!empty($eventsToSync)) {
            $syncedEventsCount = $this->calendarEventService->batchUpsertFromGoogle($userId, $eventsToSync);
        }
    
        $integration->update(['last_synced_at' => now()]);
        
        // Fetch fresh events to return
        $syncedEvents = $this->calendarEventService->getUpcomingForUser($userId, 30);

        return [
            'synced' => $syncedEventsCount,
            'events' => $syncedEvents,
        ];
    }

    /**
     * Fetch events from Google Calendar API.
     *
     * @return array<int, array<string, mixed>>
     * @throws ServiceException
     */
    public function fetchEvents(
        Integration $integration,
        ?Carbon $from = null,
        ?Carbon $to = null
    ): array {
        $from ??= now()->subDays(7)->startOfDay();
        $to ??= now()->addDays(30)->endOfDay();

        $allEvents = [];
        $pageToken = null;

        do {
            $params = [
                'timeMin' => $from->toRfc3339String(),
                'timeMax' => $to->toRfc3339String(),
                'singleEvents' => 'true',
                'orderBy' => 'startTime',
                'maxResults' => 250,
            ];

            if ($pageToken) {
                $params['pageToken'] = $pageToken;
            }

            $response = $this->authenticatedGet(
                $integration,
                CALENDAR_API_BASE . '/calendars/primary/events',
                $params,
                'Failed to fetch calendar events'
            );

            $data = $response->json();
            $items = $data['items'] ?? [];
            Log::info('Fetched Google Events Page', ['count' => count($items), 'nextPage' => isset($data['nextPageToken'])]);
            $allEvents = array_merge($allEvents, $items);
            
            $pageToken = $data['nextPageToken'] ?? null;

        } while ($pageToken);

        return $allEvents;
    }

    /**
     * Get upcoming events for a user.
     *
     * @return Collection<int, CalendarEvent>
     */
    public function getUpcomingEvents(int $userId, int $days = 7): Collection
    {
        return $this->calendarEventService->getUpcomingForUser($userId, $days);
    }
}
