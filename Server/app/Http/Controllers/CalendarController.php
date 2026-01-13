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
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

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
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'type' => 'nullable|string|in:deep_work,meeting,external',
            'description' => 'nullable|string',
        ]);

        // Parse incoming times and convert to UTC string for storage
        $startTime = Carbon::parse($validated['start_time'])->setTimezone('UTC')->format('Y-m-d H:i:s');
        $endTime = Carbon::parse($validated['end_time'])->setTimezone('UTC')->format('Y-m-d H:i:s');

        $event = $this->calendarEventService->create([
            'user_id' => $request->user()->id,
            'title' => $validated['title'],
            'start_time' => $startTime,
            'end_time' => $endTime,
            'type' => $validated['type'] ?? 'deep_work',
            'metadata' => isset($validated['description']) ? ['description' => $validated['description']] : null,
        ]);

        return $this->successResponse(new CalendarEventResource($event), 'Event created successfully');
    }


    /**
     * Update a calendar event.
     */
    public function update(Request $request, CalendarEvent $event): JsonResponse
    {
        Log::info('Update Event Request', [
            'event_id' => $event->id,
            'user_id' => $request->user()->id,
            'data' => $request->all()
        ]);

        // Ensure user owns this event
        if ($event->user_id !== $request->user()->id) {
            return $this->forbiddenResponse('You do not own this calendar event');
        }

        try {
            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'start_time' => 'sometimes|date',
                'end_time' => 'sometimes|date|after:start_time',
                'type' => 'sometimes|string|in:deep_work,meeting,external',
                'description' => 'nullable|string',
            ]);

            Log::info('Validated Data', $validated);

            $updateData = [];
            if (isset($validated['title'])) $updateData['title'] = $validated['title'];
    
            if (isset($validated['start_time'])) {
                $parsed = Carbon::parse($validated['start_time']);
                $utcTime = $parsed->setTimezone('UTC');
                $updateData['start_time'] = $utcTime->format('Y-m-d H:i:s');
                Log::info('Timezone Debug', [
                    'input' => $validated['start_time'],
                    'utc_string' => $updateData['start_time'],
                ]);
            }
            if (isset($validated['end_time'])) {
                $parsed = Carbon::parse($validated['end_time']);
                $updateData['end_time'] = $parsed->setTimezone('UTC')->format('Y-m-d H:i:s');
            }
            if (isset($validated['type'])) $updateData['type'] = $validated['type'];
            
            if (isset($validated['description'])) {
                $metadata = $event->metadata ?? [];
                $metadata['description'] = $validated['description'];
                $updateData['metadata'] = $metadata;
            }

            $event->update($updateData);
            $event->refresh();

            Log::info('Event After Update (DB State)', $event->toArray());

            return $this->successResponse(new CalendarEventResource($event), 'Event updated successfully');
        } catch (\Exception $e) {
            Log::error('Update Event Failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a calendar event.
     */
    public function destroy(Request $request, CalendarEvent $event): JsonResponse
    {
        if ($event->user_id !== $request->user()->id) {
            return $this->forbiddenResponse('You do not own this calendar event');
        }

        $event->delete();

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
