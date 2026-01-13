<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CalendarEvent;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;

/**
 * @extends BaseService<CalendarEvent>
 */
final class CalendarEventService extends BaseService
{
    protected function getModelClass(): string
    {
        return CalendarEvent::class;
    }

    /**
     * Create or update a calendar event from Google API response.
     * All times are normalized to UTC before saving to ensure correct sorting.
     *
     * @param array<string, mixed> $googleEvent
     */
    public function upsertFromGoogle(int $userId, array $googleEvent): CalendarEvent
    {
        $externalId = $googleEvent['id'] ?? null;

        $startTime = $this->parseGoogleDateTime($googleEvent['start'] ?? []);
        $endTime = $this->parseGoogleDateTime($googleEvent['end'] ?? []);

        // Convert to UTC for consistent database storage and sorting
        $startTimeUtc = $startTime?->setTimezone('UTC')->toDateTimeString();
        $endTimeUtc = $endTime?->setTimezone('UTC')->toDateTimeString();

        // Determine type based on Google Event properties
        $type = 'external'; // Default for general imported events
        
        $eventType = $googleEvent['eventType'] ?? 'default';
        
        if ($eventType === 'focusTime' || stripos($googleEvent['summary'] ?? '', 'Focus Time') !== false || stripos($googleEvent['summary'] ?? '', 'Deep Work') !== false) {
            $type = 'deep_work';
        } elseif (!empty($googleEvent['attendees'])) {
            $type = 'meeting';
        }

        if ($externalId === null) {
            return $this->create([
                'user_id' => $userId,
                'title' => $googleEvent['summary'] ?? 'Untitled Event',
                'start_time' => $startTimeUtc,
                'end_time' => $endTimeUtc,
                'status' => $googleEvent['status'] ?? 'confirmed',
                'type' => $type,
                'metadata' => $googleEvent,
            ]);
        }

        $existing = CalendarEvent::where('user_id', $userId)
            ->where('external_id', $externalId)
            ->first();

        if ($existing) {
            $existing->update([
                'title' => $googleEvent['summary'] ?? $existing->title,
                'start_time' => $startTimeUtc,
                'end_time' => $endTimeUtc,
                'status' => $googleEvent['status'] ?? $existing->status,
                'type' => $type,
                'metadata' => $googleEvent,
            ]);

            return $existing->fresh();
        }

        return $this->create([
            'user_id' => $userId,
            'external_id' => $externalId,
            'title' => $googleEvent['summary'] ?? 'Untitled Event',
            'start_time' => $startTimeUtc,
            'end_time' => $endTimeUtc,
            'status' => $googleEvent['status'] ?? 'confirmed',
            'type' => $type,
            'metadata' => $googleEvent,
        ]);
    }

    /**
     * Get upcoming events for a user.
     *
     * @return Collection<int, CalendarEvent>
     */
    public function getUpcomingForUser(int $userId, int $days = 7): Collection
    {
        return CalendarEvent::where('user_id', $userId)
            ->where('start_time', '>=', now())
            ->where('start_time', '<=', now()->addDays($days))
            ->orderBy('start_time')
            ->get();
    }

    /**
     * Get events within a date range for a user.
     *
     * @return Collection<int, CalendarEvent>
     */
    public function getInRangeForUser(int $userId, string $start, string $end): Collection
    {
        return CalendarEvent::where('user_id', $userId)
            ->where('start_time', '<=', $end)
            ->where('end_time', '>=', $start)
            ->orderBy('start_time')
            ->get();
    }

    /**
     * Get events for today.
     *
     * @return Collection<int, CalendarEvent>
     */
    public function getTodayForUser(int $userId): Collection
    {
        return CalendarEvent::where('user_id', $userId)
            ->whereDate('start_time', today())
            ->orderBy('start_time')
            ->get();
    }

    /**
     * Parse Google Calendar datetime object.
     * Returns a Carbon instance for consistent timezone handling.
     *
     * @param array<string, mixed> $dateTime
     */
    private function parseGoogleDateTime(array $dateTime): ?Carbon
    {
        // Google returns 'dateTime' for timed events (with timezone offset)
        if (isset($dateTime['dateTime'])) {
            // Carbon::parse handles various timezone formats (Z, +00:00, -05:00, etc.)
            return Carbon::parse($dateTime['dateTime']);
        }

        // Google returns 'date' (YYYY-MM-DD) for all-day events
        if (isset($dateTime['date'])) {
            // Create as midnight UTC explicitly to prevent timezone shifts
            // that could cause the event to appear on the wrong day
            return Carbon::createFromFormat('Y-m-d', $dateTime['date'], 'UTC')
                ->startOfDay();
        }

        return null;
    }
}
