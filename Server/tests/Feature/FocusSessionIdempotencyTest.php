<?php

namespace Tests\Feature;

use App\Models\ContextSnapshot;
use App\Models\FocusSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class FocusSessionIdempotencyTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_starts_a_new_session_if_none_active()
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->postJson('/api/focus-sessions', [
            'title' => 'New Session',
        ]);

        $response->assertStatus(201)
            ->assertJson(['data' => ['status' => 'started']]);
        
        $this->assertDatabaseHas('focus_sessions', [
            'user_id' => $user->id,
            'title' => 'New Session',
            'ended_at' => null,
        ]);
    }

    public function test_it_resumes_existing_session_if_title_matches()
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->actingAs($user);

        // Start first
        $this->postJson('/api/focus-sessions', ['title' => 'Task A']);
        
        /** @var FocusSession $session */
        $session = FocusSession::first(['*']);

        // Start again (Resume)
        $response = $this->postJson('/api/focus-sessions', ['title' => 'Task A']);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'status' => 'resumed',
                    'session' => ['id' => $session->id]
                ]
            ]);
    }

    public function test_it_switches_session_if_title_differs()
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->actingAs($user);

        // Start first
        $this->postJson('/api/focus-sessions', ['title' => 'Task A']);
        
        /** @var FocusSession $session1 */
        $session1 = FocusSession::first(['*']);

        // Switch
        $response = $this->postJson('/api/focus-sessions', ['title' => 'Task B']);

        $response->assertStatus(201)
            ->assertJson(['data' => ['status' => 'started']]);
        
        // Check old session abandoned
        $this->assertDatabaseHas('focus_sessions', [
            'id' => $session1->id,
            'status' => 'abandoned',
        ]);
    }

    public function test_it_restores_context_from_previous_session()
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->actingAs($user);

        // 1. Setup: Create a past session with a context snapshot
        // We need to manually create snapshot first because our controller doesn't create them yet
        $snapshot = ContextSnapshot::create([
            'user_id' => $user->id,
            'title' => 'Project X Context',
            'type' => 'manual',
            'created_at' => now(),
        ]);

        $pastSession = FocusSession::create([
            'user_id' => $user->id,
            'title' => 'Project X',
            'status' => 'completed',
            'started_at' => now()->subDay(),
            'ended_at' => now()->subDay()->addHour(),
            'context_snapshot_id' => $snapshot->id,
            'planned_duration_min' => 25,
        ]);

        // 2. Action: Start a NEW session with the same title
        $response = $this->postJson('/api/focus-sessions', [
            'title' => 'Project X',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'status' => 'started',
                    'restored_context' => true,
                ]
            ]);

        // 3. Verify: New session should have the SAME snapshot ID
        /** @var FocusSession $newSession */
        $newSession = FocusSession::query()->where('id', '!=', $pastSession->id)->first(['*']);
        $this->assertEquals($snapshot->id, $newSession->context_snapshot_id);
    }
}
