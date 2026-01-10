<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exceptions\ServiceException;
use App\Http\Resources\CalendarEventResource;
use App\Models\CalendarEvent;
use App\Services\CalendarEventService;
use App\Services\GoogleCalendarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class CalendarController extends BaseController
{
    public function __construct(
        private readonly GoogleCalendarService $googleCalendarService,
        private readonly CalendarEventService $calendarEventService
    ) {}

    /**
     * List calendar events for the authenticated user.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $days = (int) $request->query('days', '7');

        $events = $this->calendarEventService->getUpcomingForUser(
            $request->user()->id,
            min($days, 30) // Cap at 30 days
        );

        return CalendarEventResource::collection($events);
    }

    /**
     * Get today's calendar events.
     */
    public function today(Request $request): AnonymousResourceCollection
    {
        $events = $this->calendarEventService->getTodayForUser($request->user()->id);

        return CalendarEventResource::collection($events);
    }

    /**
     * Sync calendar events from Google Calendar.
     */
    public function sync(Request $request): JsonResponse
    {
        try {
            $result = $this->googleCalendarService->syncEventsForUser($request->user()->id);

            return $this->successResponse(
                data: [
                    'synced' => $result['synced'],
                    'events' => CalendarEventResource::collection($result['events']),
                ],
                message: "Synced {$result['synced']} events from Google Calendar"
            );
        } catch (ServiceException $e) {
            return $this->handleServiceException($e);
        }
    }

    /**
     * Get a specific calendar event.
     */
    public function show(Request $request, CalendarEvent $event): JsonResponse
    {
        // Ensure user owns this event
        if ($event->user_id !== $request->user()->id) {
            return $this->forbiddenResponse('You do not own this calendar event');
        }

        return $this->successResponse(new CalendarEventResource($event));
    }
}
