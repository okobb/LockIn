<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\CalendarEventService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;

class CalendarEventServiceTest extends TestCase
{
    use RefreshDatabase;

    private CalendarEventService $service;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->service = app(CalendarEventService::class);
    }

    #[Test]
    public function test_create_for_user_adds_manual_tag()
    {
        $data = [
            'title' => 'Manual Event',
            'start_time' => now()->toDateTimeString(),
            'end_time' => now()->addHour()->toDateTimeString(),
            'tags' => ['Work'],
        ];

        $event = $this->service->createForUser($this->user->id, $data);

        $this->assertContains('Manual', $event->metadata['tags']);
        $this->assertContains('Work', $event->metadata['tags']);
        $this->assertEquals('manual', $event->source);
    }

    #[Test]
    public function test_determine_event_type_for_focus_time()
    {
        $googleEvent = [
            'id' => 'evt_123',
            'summary' => 'Focus Time',
            'start' => ['dateTime' => now()->toIso8601String()],
            'end' => ['dateTime' => now()->addHour()->toIso8601String()],
            'eventType' => 'focusTime',
        ];

        $event = $this->service->upsertFromGoogle($this->user->id, $googleEvent);

        $this->assertEquals('deep_work', $event->type);

        $googleEvent2 = [
            'id' => 'evt_456',
            'summary' => 'Deep Work Session',
            'start' => ['dateTime' => now()->toIso8601String()],
            'end' => ['dateTime' => now()->addHour()->toIso8601String()],
        ];

        $event2 = $this->service->upsertFromGoogle($this->user->id, $googleEvent2);
        
        $this->assertEquals('deep_work', $event2->type);
    }

    #[Test]
    public function test_determine_event_type_for_meetings()
    {
        $googleEvent = [
            'id' => 'evt_meeting',
            'summary' => 'Team Sync',
            'start' => ['dateTime' => now()->toIso8601String()],
            'end' => ['dateTime' => now()->addHour()->toIso8601String()],
            'attendees' => [
                ['email' => 'colleague@example.com']
            ]
        ];

        $event = $this->service->upsertFromGoogle($this->user->id, $googleEvent);

        $this->assertEquals('meeting', $event->type);
    }

    #[Test]
    public function test_batch_upsert_from_google_syncs_events()
    {
        $payload = [
            [
                'id' => 'evt_1',
                'summary' => 'Event 1',
                'start' => ['dateTime' => now()->toIso8601String()],
                'end' => ['dateTime' => now()->addHour()->toIso8601String()],
            ],
            [
                'id' => 'evt_2',
                'summary' => 'Event 2',
                'start' => ['dateTime' => now()->addHours(2)->toIso8601String()],
                'end' => ['dateTime' => now()->addHours(3)->toIso8601String()],
            ]
        ];

        $count = $this->service->batchUpsertFromGoogle($this->user->id, $payload);

        $this->assertEquals(2, $count);
        $this->assertDatabaseHas('calendar_events', ['external_id' => 'evt_1']);
        $this->assertDatabaseHas('calendar_events', ['external_id' => 'evt_2']);

        $payload[0]['summary'] = 'Event 1 Updated';
        $this->service->batchUpsertFromGoogle($this->user->id, [$payload[0]]);
        
        $this->assertDatabaseHas('calendar_events', [
            'external_id' => 'evt_1', 
            'title' => 'Event 1 Updated'
        ]);
    }

    #[Test]
    public function test_parse_google_datetime_handles_all_day_events()
    {
        $allDayEvent = [
            'id' => 'evt_all_day',
            'summary' => 'All Day Event',
            'start' => ['date' => '2026-05-01'], // All day
            'end' => ['date' => '2026-05-02'],
        ];

        $event = $this->service->upsertFromGoogle($this->user->id, $allDayEvent);

        $this->assertEquals('2026-05-01 00:00:00', $event->start_time);
    }

    #[Test]
    public function test_get_in_range_filters_correctly()
    {
        $this->service->createForUser($this->user->id, [
            'title' => 'Past',
            'start_time' => now()->subHours(2)->toDateTimeString(),
            'end_time' => now()->subHour()->toDateTimeString(),
        ]);

        $this->service->createForUser($this->user->id, [
            'title' => 'Future',
            'start_time' => now()->addHour()->toDateTimeString(),
            'end_time' => now()->addHours(2)->toDateTimeString(),
        ]);

        $events = $this->service->getInRangeForUser(
            $this->user->id, 
            now()->toDateTimeString(), 
            now()->addHours(3)->toDateTimeString()
        );

        $this->assertCount(1, $events);
        $this->assertEquals('Future', $events->first()->title);
    }
}
