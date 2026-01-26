<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\DashboardService;
use App\Models\User;
use App\Models\Task;
use App\Models\CalendarEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\Test;

class DashboardServiceTest extends TestCase
{
    use RefreshDatabase;

    private DashboardService $service;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->service = app(DashboardService::class);
    }

    #[Test]
    public function test_get_priority_tasks_filters_high_priority()
    {
        $t1 = Task::factory()->create(['user_id' => $this->user->id, 'priority' => 1, 'status' => 'open', 'title' => 'Important']);
        $t2 = Task::factory()->create(['user_id' => $this->user->id, 'priority' => 2, 'status' => 'open', 'title' => 'Medium']);
        $t3 = Task::factory()->create(['user_id' => $this->user->id, 'priority' => 3, 'status' => 'open', 'title' => 'Low']);
        $t4 = Task::factory()->create(['user_id' => $this->user->id, 'priority' => 1, 'status' => 'done', 'title' => 'Done']);

        $results = $this->service->getPriorityTasks($this->user->id);

        $this->assertCount(2, $results);
        $this->assertTrue($results->contains('title', 'Important'));
        $this->assertTrue($results->contains('title', 'Medium'));
        $this->assertFalse($results->contains('title', 'Low'));
        $this->assertFalse($results->contains('title', 'Done'));
    }

    #[Test]
    public function test_get_stats_returns_correct_flow_time_format()
    {
        CalendarEvent::create([
            'user_id' => $this->user->id,
            'title' => 'Deep Work',
            'type' => 'deep_work',
            'start_time' => now()->startOfDay()->addHours(10),
            'end_time' => now()->startOfDay()->addHours(11)->addMinutes(30),
            'source' => 'manual',
        ]);

        $stats = $this->service->getStats($this->user->id);

        $this->assertEquals('1h 30m', $stats['flowTime']);
        $this->assertEquals(1, $stats['deepWorkBlocks']);
    }

    #[Test]
    public function test_get_upcoming_events_filters_today()
    {
        CalendarEvent::create([
            'user_id' => $this->user->id,
            'title' => 'Past Today',
            'start_time' => now()->subHour(),
            'end_time' => now()->subMinutes(30),
            'source' => 'manual',
        ]);

        CalendarEvent::create([
            'user_id' => $this->user->id,
            'title' => 'Future Today',
            'start_time' => now()->addHour(),
            'end_time' => now()->addHours(2),
            'source' => 'manual',
        ]);

        CalendarEvent::create([
            'user_id' => $this->user->id,
            'title' => 'Tomorrow',
            'start_time' => now()->addDay(),
            'end_time' => now()->addDay()->addHour(),
            'source' => 'manual',
        ]);

        $events = $this->service->getUpcomingEvents($this->user->id);

        $this->assertCount(1, $events);
        $this->assertEquals('Future Today', $events->first()['title']);
    }

    #[Test]
    public function test_priority_tasks_return_correct_colors()
    {
        Task::factory()->create(['user_id' => $this->user->id, 'priority' => 1, 'title' => 'P1']);
        Task::factory()->create(['user_id' => $this->user->id, 'priority' => 2, 'title' => 'P2']);
        
        $results = $this->service->getPriorityTasks($this->user->id);
        
        $p1 = $results->firstWhere('title', 'P1');
        $p2 = $results->firstWhere('title', 'P2');
        
        $this->assertEquals('red', $p1['tagColor']);
        $this->assertEquals('yellow', $p2['tagColor']);
    }

    #[Test]
    public function test_priority_tasks_format_sender_correctly()
    {
        Task::factory()->create([
            'user_id' => $this->user->id,
            'title' => 'Email Task',
            'priority' => 1,
            'source_metadata' => ['sender' => 'John Doe <john@example.com>'],
        ]);

        $taskWithMsg = Task::factory()->create([
            'user_id' => $this->user->id,
            'title' => 'Msg Task',
            'priority' => 1,
        ]);
        \App\Models\IncomingMessage::create([
            'user_id' => $this->user->id,
            'extracted_task_id' => $taskWithMsg->id,
            'sender_info' => 'Jane Smith <jane@test.com>',
            'status' => 'pending',
            'provider' => 'gmail',
            'provider_id' => 'msg-1',
            'external_id' => 'ext-1',
            'content_raw' => 'Body',
            'received_at' => now(),
        ]);

        $results = $this->service->getPriorityTasks($this->user->id);

        $emailTask = $results->firstWhere('title', 'Email Task');
        $msgTask = $results->firstWhere('title', 'Msg Task');

        $this->assertEquals('John Doe', $emailTask['reference']);
        $this->assertEquals('Jane Smith', $msgTask['reference']);
    }
}
