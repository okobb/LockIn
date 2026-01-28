<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\AgendaService;
use App\Models\User;
use App\Models\Task;
use App\Models\CalendarEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Carbon;
use PHPUnit\Framework\Attributes\Test;

class AgendaServiceTest extends TestCase
{
    use RefreshDatabase;

    private AgendaService $service;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->service = app(AgendaService::class);
        Cache::flush();
    }

    #[Test]
    public function test_unified_agenda_merges_events_and_tasks_chronologically()
    {
        Carbon::setTestNow(Carbon::parse('2024-01-01 08:00:00'));

        CalendarEvent::create([
            'user_id' => $this->user->id,
            'title' => 'Meeting',
            'start_time' => now()->copy()->setHour(10)->setMinute(0),
            'end_time' => now()->copy()->setHour(11)->setMinute(0),
            'source' => 'manual',
            'type' => 'meeting'
        ]);

        Task::factory()->create([
            'user_id' => $this->user->id,
            'title' => 'Morning Task',
            'status' => 'open',
            'scheduled_start' => now()->copy()->setHour(9)->setMinute(0),
        ]);

        Task::factory()->create([
            'user_id' => $this->user->id,
            'title' => 'Due Task',
            'status' => 'open',
            'due_date' => now()->copy()->startOfDay(), 
            'scheduled_start' => null,
            'estimated_minutes' => 45,
        ]);

        Task::factory()->create([
            'user_id' => $this->user->id,
            'title' => 'Done Task',
            'status' => 'done',
            'scheduled_start' => now()->copy()->setHour(12)->setMinute(0),
            'completed_at' => now(),
        ]);

        CalendarEvent::create([
            'user_id' => $this->user->id,
            'title' => 'Past Event',
            'start_time' => now()->copy()->subHours(2),
            'end_time' => now()->copy()->subHour(),
            'source' => 'manual',
        ]);

        $agenda = $this->service->getUnifiedAgenda($this->user->id);
        
        $this->assertCount(3, $agenda);
        
        $this->assertEquals('Due Task', $agenda[0]['title']);
        $this->assertEquals('Anytime', $agenda[0]['time']);
        $this->assertNotNull($agenda[0]['startTime']);

        $this->assertEquals('Morning Task', $agenda[1]['title']);
        $this->assertEquals('09:00', $agenda[1]['time']);
        $this->assertEquals('task', $agenda[1]['itemType']);

        $this->assertEquals('Meeting', $agenda[2]['title']);
        $this->assertEquals('10:00', $agenda[2]['time']);
        $this->assertEquals('event', $agenda[2]['itemType']);
    }
    
    #[Test]
    public function test_maps_event_types_correctly()
    {
        Carbon::setTestNow(Carbon::parse('2024-01-01 08:00:00'));
        
        CalendarEvent::create([
            'user_id' => $this->user->id,
            'title' => 'Deep Work',
            'type' => 'deep_work',
            'start_time' => now()->addHour(),
            'end_time' => now()->addHours(2),
        ]);
        
        $agenda = $this->service->getUnifiedAgenda($this->user->id);
        
        $this->assertEquals('focus', $agenda[0]['type']);
    }

    #[Test]
    public function test_deduplicates_tasks_linked_to_events()
    {
        Carbon::setTestNow(Carbon::parse('2024-01-01 08:00:00'));

        $task = Task::factory()->create([
            'user_id' => $this->user->id,
            'title' => 'Linked Task',
            'status' => 'open',
            'scheduled_start' => now()->addHours(2),
        ]);

        CalendarEvent::create([
            'user_id' => $this->user->id,
            'title' => 'Time Block for Task',
            'type' => 'deep_work',
            'start_time' => now()->addHours(2),
            'end_time' => now()->addHours(3),
            'metadata' => ['task_id' => $task->id],
        ]);

        $agenda = $this->service->getUnifiedAgenda($this->user->id);

        $this->assertCount(1, $agenda);
        $this->assertEquals('Time Block for Task', $agenda[0]['title']);
        $this->assertEquals('event', $agenda[0]['itemType']);
    }
}
