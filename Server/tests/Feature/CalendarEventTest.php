<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CalendarEventTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_event_with_tags_and_priority()
    {
        $user = User::factory()->create();

        $data = [
            'title' => 'Deep Work Session',
            'start_time' => now()->addHour()->toDateTimeString(),
            'end_time' => now()->addHours(2)->toDateTimeString(),
            'type' => 'deep_work',
            'priority' => 'high',
            'tags' => ['coding', 'feature'],
        ];

        $response = $this->actingAs($user, 'api')
            ->postJson(route('calendar.store'), $data);

        $response->assertStatus(200);
        
        $this->assertDatabaseHas('calendar_events', [
            'user_id' => $user->id,
            'title' => 'Deep Work Session',
            'type' => 'deep_work',
        ]);

        $event = $user->calendarEvents()->first();
        
        $this->assertNotNull($event->metadata);
        $this->assertEquals('high', $event->metadata['priority']);
        $this->assertContains('coding', $event->metadata['tags']);
        $this->assertContains('feature', $event->metadata['tags']);
        $this->assertContains('Manual', $event->metadata['tags']);
    }

    public function test_can_update_event_with_tags_and_priority()
    {
        $user = User::factory()->create();
        $event = $user->calendarEvents()->create([
            'title' => 'Original Title',
            'start_time' => now()->addHour(),
            'end_time' => now()->addHours(2),
            'type' => 'meeting',
            'metadata' => ['tags' => ['old'], 'priority' => 'low'],
        ]);

        $data = [
            'tags' => ['new', 'updated'],
            'priority' => 'urgent',
        ];

        $response = $this->actingAs($user, 'api')
            ->patchJson(route('calendar.update', $event), $data);

        $response->assertStatus(200);

        $event->refresh();
        
        $this->assertEquals('urgent', $event->metadata['priority']);
        $this->assertContains('new', $event->metadata['tags']);
        $this->assertContains('updated', $event->metadata['tags']);
        $this->assertNotContains('old', $event->metadata['tags']);
    }
}
