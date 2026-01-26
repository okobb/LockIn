<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\FocusSessionService;
use App\Models\User;
use App\Models\Task;
use App\Models\ContextSnapshot;
use App\Models\FocusSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;

class FocusSessionServiceTest extends TestCase
{
    use RefreshDatabase;

    private FocusSessionService $service;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(FocusSessionService::class);
        $this->user = User::factory()->create();
    }

    #[Test]
    public function test_start_session_creates_session_with_correct_defaults()
    {
        $session = $this->service->startSession(
            $this->user->id,
            'My Focus Session',
            null,
            25,
            null
        );

        $this->assertDatabaseHas('focus_sessions', [
            'id' => $session->id,
            'user_id' => $this->user->id,
            'title' => 'My Focus Session',
            'planned_duration_min' => 25,
            'status' => 'active',
        ]);
        
        $this->assertNotNull($session->started_at);
        $this->assertNotNull($session->scheduled_end_at);
    }
    
    #[Test]
    public function test_handle_session_start_resumes_matching_active_session()
    {
        $task = Task::factory()->create([
            'user_id' => $this->user->id,
        ]);
        
        $context = ContextSnapshot::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $existing = FocusSession::factory()->create([
            'user_id' => $this->user->id,
            'title' => 'Existing Session',
            'status' => 'active',
            'task_id' => $task->id,
            'context_snapshot_id' => $context->id,
            'ended_at' => null, // Ensure it's active
        ]);

        $result = $this->service->handleSessionStart($this->user->id, [
            'title' => 'Existing Session',
            'task_id' => $task->id,
            'duration_min' => 25,
        ]);

        $this->assertEquals($existing->id, $result['session']->id);
        $this->assertEquals('resumed', $result['status']);
        $this->assertEquals($context->id, $result['session']->context_snapshot_id);
    }

    #[Test]
    public function test_handle_session_start_abandons_active_session_for_new_task()
    {
        $original = FocusSession::factory()->create([
            'user_id' => $this->user->id,
            'title' => 'Original Session',
            'status' => 'active',
            'ended_at' => null, // Ensure it's active
        ]);
        
        $newTask = Task::factory()->create(['user_id' => $this->user->id]);

        $result = $this->service->handleSessionStart($this->user->id, [
            'title' => 'New Different Session',
            'task_id' => $newTask->id,
            'duration_min' => 45,
        ]);

        $this->assertNotEquals($original->id, $result['session']->id);
        $this->assertEquals('started', $result['status']);
        
        $original->refresh();
        $this->assertEquals('abandoned', $original->status);
        $this->assertEquals('New Different Session', $result['session']->title);
    }

    #[Test]
    public function test_get_history_returns_paginated_results()
    {
        FocusSession::factory()->count(25)->create([
            'user_id' => $this->user->id,
            'status' => 'completed',
            'ended_at' => now()->subDay(),
        ]);

        $result = $this->service->getHistory($this->user->id, ['status' => 'completed']);

        $this->assertEquals(20, $result->count());
        $this->assertEquals(25, $result->total());
        $this->assertEquals(2, $result->lastPage());
    }

    #[Test]
    public function test_get_stats_calculates_correctly()
    {
        // 2 completed sessions this week
        FocusSession::factory()->count(2)->create([
            'user_id' => $this->user->id,
            'status' => 'completed',
            'started_at' => now()->startOfWeek()->addHour(),
            'ended_at' => now()->startOfWeek()->addHours(2),
            'actual_duration_min' => 60,
        ]);

        // 1 active session (should be ignored)
        FocusSession::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'active',
            'ended_at' => null,
        ]);

        // 1 old completed session
        FocusSession::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'completed',
            'ended_at' => now()->subWeeks(2),
            'actual_duration_min' => 30,
        ]);

        $stats = $this->service->getStats($this->user->id);

        $this->assertEquals(3, $stats['total_contexts']); // 2 this week + 1 old
        $this->assertEquals(2, $stats['this_week']);
        $this->assertEquals(150, $stats['time_saved_minutes']); // 60*2 + 30
    }
}
