<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ServiceException;
use App\Models\CalendarEvent;
use App\Models\Integration;
use App\Services\Traits\UsesIntegrationTokens;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

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

        $googleEvents = $this->fetchEvents($integration);

        $syncedEvents = collect();
        foreach ($googleEvents as $googleEvent) {
            $event = $this->calendarEventService->upsertFromGoogle($userId, $googleEvent);
            $syncedEvents->push($event);
        }

        return [
            'synced' => $syncedEvents->count(),
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
        $from ??= now()->startOfDay();
        $to ??= now()->addDays(7)->endOfDay();

        $response = $this->authenticatedGet(
            $integration,
            CALENDAR_API_BASE . '/calendars/primary/events',
            [
                'timeMin' => $from->toRfc3339String(),
                'timeMax' => $to->toRfc3339String(),
                'singleEvents' => 'true',
                'orderBy' => 'startTime',
                'maxResults' => 100,
            ],
            'Failed to fetch calendar events'
        );

        return $response->json('items', []);
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
