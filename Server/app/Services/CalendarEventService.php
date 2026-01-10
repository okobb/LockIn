<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CalendarEvent;
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
     *
     * @param array<string, mixed> $googleEvent
     */
    public function upsertFromGoogle(int $userId, array $googleEvent): CalendarEvent
    {
        $externalId = $googleEvent['id'] ?? null;

        if ($externalId === null) {
            return $this->create([
                'user_id' => $userId,
                'title' => $googleEvent['summary'] ?? 'Untitled Event',
                'start_time' => $this->parseGoogleDateTime($googleEvent['start'] ?? []),
                'end_time' => $this->parseGoogleDateTime($googleEvent['end'] ?? []),
                'status' => $googleEvent['status'] ?? 'confirmed',
                'metadata' => $googleEvent,
            ]);
        }

        $existing = CalendarEvent::where('user_id', $userId)
            ->where('external_id', $externalId)
            ->first();

        if ($existing) {
            $existing->update([
                'title' => $googleEvent['summary'] ?? $existing->title,
                'start_time' => $this->parseGoogleDateTime($googleEvent['start'] ?? []),
                'end_time' => $this->parseGoogleDateTime($googleEvent['end'] ?? []),
                'status' => $googleEvent['status'] ?? $existing->status,
                'metadata' => $googleEvent,
            ]);

            return $existing->fresh();
        }

        return $this->create([
            'user_id' => $userId,
            'external_id' => $externalId,
            'title' => $googleEvent['summary'] ?? 'Untitled Event',
            'start_time' => $this->parseGoogleDateTime($googleEvent['start'] ?? []),
            'end_time' => $this->parseGoogleDateTime($googleEvent['end'] ?? []),
            'status' => $googleEvent['status'] ?? 'confirmed',
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
     *
     * @param array<string, mixed> $dateTime
     */
    private function parseGoogleDateTime(array $dateTime): ?string
    {
        // Google returns either 'dateTime' for timed events or 'date' for all-day events
        if (isset($dateTime['dateTime'])) {
            return $dateTime['dateTime'];
        }

        if (isset($dateTime['date'])) {
            return $dateTime['date'] . 'T00:00:00';
        }

        return null;
    }
}
