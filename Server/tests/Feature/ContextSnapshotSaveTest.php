<?php

namespace Tests\Feature;

use App\Models\FocusSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ContextSnapshotSaveTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_save_snapshot_and_complete_session()
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $session = FocusSession::factory()->create([
            'user_id' => $user->id,
            'status' => 'active',
        ]);

        $browserState = [
            ['title' => 'Google', 'url' => 'https://google.com'],
            ['title' => 'GitHub', 'url' => 'https://github.com'],
        ];

        $response = $this->actingAs($user)->postJson(route('context.save'), [
            'focus_session_id' => $session->id,
            'note' => 'Test note',
            'browser_state' => json_encode($browserState), // Simulate how frontend sends it
            'checklist' => ['Item 1', 'Item 2'],
            'should_complete' => true,
        ]);

        $response->assertStatus(201);
        
        $this->assertDatabaseHas('context_snapshots', [
            'focus_session_id' => $session->id,
            'text_note' => 'Test note',
        ]);

        $session->refresh();
        $this->assertEquals('completed', $session->status);
        $this->assertNotNull($session->ended_at);
        $this->assertNotNull($session->contextSnapshot);
        
        // Verify browser state is saved correctly
        $this->assertCount(2, $session->contextSnapshot->browser_state);
        $this->assertEquals('Google', $session->contextSnapshot->browser_state[0]['title']);
    }

    public function test_browser_state_can_be_sent_as_array_too()
    {
        $user = User::factory()->create();
        $session = FocusSession::factory()->create([
            'user_id' => $user->id,
            'status' => 'active',
        ]);

        $browserState = [
            ['title' => 'Google', 'url' => 'https://google.com'],
        ];

        $response = $this->actingAs($user)->postJson(route('context.save'), [
            'focus_session_id' => $session->id,
            'browser_state' => $browserState, // Sent as array directly
            'should_complete' => true,
        ]);

        $response->assertStatus(201);
        
        $session->refresh();
        $this->assertCount(1, $session->contextSnapshot->browser_state);
    }
}
