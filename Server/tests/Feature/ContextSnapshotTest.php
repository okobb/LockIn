<?php

namespace Tests\Feature;

use App\Models\FocusSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ContextSnapshotTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_saves_context_and_links_to_session()
    {
        Storage::fake('local');
        /** @var User $user */
        $user = User::factory()->create();
        $this->actingAs($user);

        $session = FocusSession::create([
            'user_id' => $user->id,
            'title' => 'My Task',
            'started_at' => now(),
            'status' => 'active',
            'planned_duration_min' => 25,
        ]);

        $response = $this->postJson('/api/context/save', [
            'focus_session_id' => $session->id,
            'note' => 'Leaving off here',
            'browser_state' => ['https://google.com'],
            'git_state' => ['branch' => 'main'],
            'voice_file' => UploadedFile::fake()->create('memo.mp3', 100),
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'created_at'
                ]
            ]);

        // Verify Database
        $this->assertDatabaseHas('context_snapshots', [
            'focus_session_id' => $session->id,
            'text_note' => 'Leaving off here',
            'git_branch' => 'main',
        ]);

        // Verify Session Linked
        $this->assertNotNull($session->fresh()->context_snapshot_id);

        // Verify File Upload
        /** @var \App\Models\ContextSnapshot $snapshot */
        $snapshot = \App\Models\ContextSnapshot::where('focus_session_id', '=', $session->id, 'and')->first(['*']);
        
        // Use facade directly for assertions to avoid static analysis confusion with the disk instance
        // Storage::fake('local'); // REMOVED: Do not reset fake storage here
        Storage::assertExists($snapshot->voice_memo_path);
    }

    public function test_it_prevents_unauthorized_save()
    {
        /** @var User $user */
        $user = User::factory()->create();
        /** @var User $otherUser */
        $otherUser = User::factory()->create();
        
        $session = FocusSession::create([
            'user_id' => $otherUser->id, // Belongs to other user
            'title' => 'Other Task',
            'started_at' => now(),
            'status' => 'active',
            'planned_duration_min' => 25,
        ]);

        $this->actingAs($user);

        $response = $this->postJson('/api/context/save', [
            'focus_session_id' => $session->id,
        ]);

        $response->assertStatus(403);
    }
}
