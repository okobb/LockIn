<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\FocusSession;
use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;

class FocusSessionControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    #[Test]
    public function test_start_session_returns_session_data()
    {
        $task = Task::factory()->create(['user_id' => $this->user->id, 'title' => 'My Task']);

        $response = $this->actingAs($this->user)
            ->postJson('/api/focus-sessions', [
                'task_id' => $task->id,
                'title' => $task->title,
                'duration_min' => 25,
            ]);

        $response->assertCreated()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'session' => ['id', 'status', 'started_at'],
                    'status',
                ]
            ]);

        $this->assertDatabaseHas('focus_sessions', [
            'user_id' => $this->user->id,
            'task_id' => $task->id,
            'status' => 'active',
        ]);
    }

    #[Test]
    public function test_idempotent_start_resumes_existing()
    {
        $task = Task::factory()->create(['user_id' => $this->user->id, 'title' => 'My Task']);

        $this->actingAs($this->user)
            ->postJson('/api/focus-sessions', [
                'task_id' => $task->id,
                'title' => $task->title,
                'duration_min' => 25,
            ])
            ->assertCreated();

        $response = $this->actingAs($this->user)
            ->postJson('/api/focus-sessions', [
                'task_id' => $task->id,
                'title' => $task->title,
                'duration_min' => 25,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'resumed');
    }

    #[Test]
    public function test_complete_session_updates_status()
    {
        $session = FocusSession::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'active',
            'started_at' => now()->subMinutes(25),
        ]);

        $response = $this->actingAs($this->user)
            ->patchJson("/api/focus-sessions/{$session->id}/complete");

        $response->assertOk();

        $this->assertDatabaseHas('focus_sessions', [
            'id' => $session->id,
            'status' => 'completed',
        ]);
        
        $this->assertNotNull($session->fresh()->ended_at);
    }

    #[Test]
    public function test_cannot_complete_other_users_session()
    {
        $otherUser = User::factory()->create();
        $otherSession = FocusSession::factory()->create(['user_id' => $otherUser->id, 'status' => 'active']);

        $this->actingAs($this->user)
            ->patchJson("/api/focus-sessions/{$otherSession->id}/complete")
            ->assertForbidden();
    }

    #[Test]
    public function test_index_returns_history_and_stats()
    {
        FocusSession::factory()->create(['user_id' => $this->user->id, 'status' => 'completed']);
        
        $response = $this->actingAs($this->user)
            ->getJson('/api/focus-sessions');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'sessions',
                    'stats',
                ]
            ]);
    }

    #[Test]
    public function test_delete_removes_session()
    {
        $session = FocusSession::factory()->create(['user_id' => $this->user->id]);

        $this->actingAs($this->user)
            ->deleteJson("/api/focus-sessions/{$session->id}")
            ->assertOk();

        $this->assertDatabaseMissing('focus_sessions', ['id' => $session->id]);
    }
}
