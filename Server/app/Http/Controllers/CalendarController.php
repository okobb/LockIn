<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exceptions\ServiceException;
use App\Http\Requests\Calendar\StoreCalendarEventRequest;
use App\Http\Requests\Calendar\UpdateCalendarEventRequest;
use App\Http\Resources\CalendarEventResource;
use App\Models\CalendarEvent;
use App\Services\CalendarEventService;
use App\Services\GoogleCalendarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;

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
        $start = $request->query('start');
        $end = $request->query('end');

        Log::info('Fetching Events', ['user_id' => $request->user()->id, 'start' => $start, 'end' => $end]);

        if ($start && $end) {
            $events = $this->calendarEventService->getInRangeForUser(
                $request->user()->id,
                $start,
                $end
            );
        } else {
            $days = (int) $request->query('days', '7');
            $events = $this->calendarEventService->getUpcomingForUser(
                $request->user()->id,
                min($days, 30)
            );
        }

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
     * Create a new calendar event.
     */
    public function store(StoreCalendarEventRequest $request): JsonResponse
    {
        $event = $this->calendarEventService->createForUser(
            $request->user()->id,
            $request->validated()
        );

        return $this->successResponse(new CalendarEventResource($event), 'Event created successfully');
    }

    /**
     * Update a calendar event.
     */
    public function update(UpdateCalendarEventRequest $request, CalendarEvent $event): JsonResponse
    {
        Log::info('Update Event Request', [
            'event_id' => $event->id,
            'user_id' => $request->user()->id,
            'data' => $request->validated()
        ]);

        $updatedEvent = $this->calendarEventService->updateEvent($event, $request->validated());

        return $this->successResponse(new CalendarEventResource($updatedEvent), 'Event updated successfully');
    }

    /**
     * Delete a calendar event.
     */
    public function destroy(Request $request, CalendarEvent $event): JsonResponse
    {
        if ($event->user_id !== $request->user()->id) {
            return $this->forbiddenResponse('You do not own this calendar event');
        }

        // If it's an external event, don't delete it, just mark as dismissed
        // If it's an external event, don't delete it, just mark as dismissed
        if ($event->external_id) {
            $event->update(['is_dismissed' => \Illuminate\Support\Facades\DB::raw('true')]);
            return $this->successResponse(null, 'Event dismissed successfully');
        }

        $this->calendarEventService->delete($event->id);

        return $this->successResponse(null, 'Event deleted successfully');
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
        } catch (\Throwable $e) {
            Log::error('Calendar Sync Failed: ' . $e->getMessage());
            return $this->errorResponse('Failed to sync calendar. Please try again later.', 500);
        }
    }

    /**
     * Get a specific calendar event.
     */
    public function show(Request $request, CalendarEvent $event): JsonResponse
    {
        if ($event->user_id !== $request->user()->id) {
            return $this->forbiddenResponse('You do not own this calendar event');
        }

        return $this->successResponse(new CalendarEventResource($event));
    }
}
