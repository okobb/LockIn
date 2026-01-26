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
     * Create a calendar event for a user.
     */
    public function createForUser(int $userId, array $data): CalendarEvent
    {
        $tags = $data['tags'] ?? [];
        
        // Add Manual tag if not present
        if (!in_array('Manual', $tags)) {
            $tags[] = 'Manual';
        }

        return $this->create([
            'user_id' => $userId,
            'source' => $data['source'] ?? 'manual',
            'title' => $data['title'],
            'start_time' => $this->toUtc($data['start_time']),
            'end_time' => $this->toUtc($data['end_time']),
            'type' => $data['type'] ?? 'deep_work',
            'metadata' => array_filter([
                'description' => $data['description'] ?? null,
                'tags' => $tags,
                'priority' => $data['priority'] ?? null,
                'task_id' => $data['task_id'] ?? null,
            ], fn($value) => !is_null($value)),
        ]);
    }

    /**
     * Update a calendar event.
     */
    public function updateEvent(CalendarEvent $event, array $data): CalendarEvent
    {
        $updateData = [];

        if (isset($data['title'])) {
            $updateData['title'] = $data['title'];
        }

        if (isset($data['start_time'])) {
            $updateData['start_time'] = $this->toUtc($data['start_time']);
        }

        if (isset($data['end_time'])) {
            $updateData['end_time'] = $this->toUtc($data['end_time']);
        }

        if (isset($data['type'])) {
            $updateData['type'] = $data['type'];
        }

        if (isset($data['description']) || isset($data['tags']) || isset($data['priority'])) {
            $metadata = $event->metadata ?? [];
            
            if (isset($data['description'])) {
                $metadata['description'] = $data['description'];
            }
            if (isset($data['tags'])) {
                $metadata['tags'] = $data['tags'];
            }
            if (isset($data['priority'])) {
                $metadata['priority'] = $data['priority'];
            }
            
            $updateData['metadata'] = $metadata;
        }

        $event->update($updateData);

        return $event->fresh();
    }

    /**
     * Batch upsert Google Calendar events.
     * 
     * @param array<int, array<string, mixed>> $googleEvents
     * @return int Number of events synced
     */
    public function batchUpsertFromGoogle(int $userId, array $googleEvents): int
    {
        if (empty($googleEvents)) {
            return 0;
        }

        $now = now();
        $upsertData = [];

        foreach ($googleEvents as $googleEvent) {
            $externalId = $googleEvent['id'] ?? null;
            if (!$externalId) {
                continue;
            }

            $startTime = $this->parseGoogleDateTime($googleEvent['start'] ?? []);
            $endTime = $this->parseGoogleDateTime($googleEvent['end'] ?? []);

            $startTimeUtc = $startTime?->setTimezone('UTC')->toDateTimeString();
            $endTimeUtc = $endTime?->setTimezone('UTC')->toDateTimeString();
            $type = $this->determineEventType($googleEvent);

            $upsertData[] = [
                'user_id' => $userId,
                'external_id' => $externalId,
                'source' => 'google',
                'title' => $googleEvent['summary'] ?? 'Untitled Event',
                'start_time' => $startTimeUtc,
                'end_time' => $endTimeUtc,
                'status' => $googleEvent['status'] ?? 'confirmed',
                'type' => $type,
                'metadata' => json_encode($googleEvent), 
                'is_dismissed' => 'f', 
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if (empty($upsertData)) {
            return 0;
        }

        CalendarEvent::upsert(
            $upsertData, 
            ['external_id', 'user_id'], 
            ['title', 'start_time', 'end_time', 'status', 'type', 'metadata', 'updated_at'] 
        );

        return count($upsertData);
    }

    /**
     * Create or update a calendar event from Google API response.
     */
    public function upsertFromGoogle(int $userId, array $googleEvent): CalendarEvent
    {
        $this->batchUpsertFromGoogle($userId, [$googleEvent]);
        
        return CalendarEvent::query()->where('user_id', $userId)
            ->where('external_id', $googleEvent['id'])
            ->firstOrFail();
    }

    /**
     * Get upcoming events for a user.
     *
     * @return Collection<int, CalendarEvent>
     */
    public function getUpcomingForUser(int $userId, int $days = 7): Collection
    {
        return CalendarEvent::query()->where('user_id', $userId)
            ->whereBoolean('is_dismissed', false)
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
        return CalendarEvent::query()->where('user_id', $userId)
            ->whereBoolean('is_dismissed', false)
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
        return CalendarEvent::query()->where('user_id', $userId)
            ->whereBoolean('is_dismissed', false)
            ->whereDate('start_time', today())
            ->orderBy('start_time')
            ->get();
    }

    /**
     * Convert a datetime string to UTC format for storage.
     */
    private function toUtc(string $dateTime): string
    {
        return Carbon::parse($dateTime)->setTimezone('UTC')->format('Y-m-d H:i:s');
    }

    /**
     * Determine event type based on Google Event properties.
     */
    private function determineEventType(array $googleEvent): string
    {
        $eventType = $googleEvent['eventType'] ?? 'default';
        $summary = $googleEvent['summary'] ?? '';

        if ($eventType === 'focusTime' || stripos($summary, 'Focus Time') !== false || stripos($summary, 'Deep Work') !== false) {
            return 'deep_work';
        }

        if (!empty($googleEvent['attendees'])) {
            return 'meeting';
        }

        return 'external';
    }

    /**
     * Parse Google Calendar datetime object.
     *
     * @param array<string, mixed> $dateTime
     */
    private function parseGoogleDateTime(array $dateTime): ?Carbon
    {
        if (isset($dateTime['dateTime'])) {
            return Carbon::parse($dateTime['dateTime']);
        }

        if (isset($dateTime['date'])) {
            return Carbon::createFromFormat('Y-m-d', $dateTime['date'], 'UTC')
                ->startOfDay();
        }

        return null;
    }
}
