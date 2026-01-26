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
}
