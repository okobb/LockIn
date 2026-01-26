<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\ContextSnapshotService;
use App\Services\TranscriptionService;
use App\Services\AIService;
use App\Models\User;
use App\Models\FocusSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Mockery;

class ContextSnapshotServiceTest extends TestCase
{
    use RefreshDatabase;

    private ContextSnapshotService $service;
    private User $user;
    private $mockTranscriptionService;
    private $mockAiService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        
        $this->mockTranscriptionService = Mockery::mock(TranscriptionService::class);
        $this->mockAiService = Mockery::mock(AIService::class);
        
        $this->service = new ContextSnapshotService(
            $this->mockTranscriptionService,
            $this->mockAiService
        );
    }

    #[Test]
    public function test_create_snapshot_from_session_data()
    {
        Storage::fake('local');
        
        $session = FocusSession::factory()->create([
            'user_id' => $this->user->id,
            'title' => 'Test Session',
        ]);
        
        $data = [
            'note' => 'My manual note',
            'browser_state' => json_encode([['title' => 'Google', 'url' => 'https://google.com']]),
            'git_state' => json_encode(['branch' => 'main', 'repo' => 'my-repo']),
            'checklist' => ['Item 1', 'Item 2'],
        ];
        
        // No voice file
        $snapshot = $this->service->processSnapshot($session, $data, null);
        
        $this->assertDatabaseHas('context_snapshots', [
            'id' => $snapshot->id,
            'focus_session_id' => $session->id,
            'text_note' => 'My manual note',
            'git_branch' => 'main',
        ]);
        
        $this->assertCount(1, $snapshot->browser_state);
        $this->assertEquals('Google', $snapshot->browser_state[0]['title']);
        $this->assertCount(2, $snapshot->ai_resume_checklist);
    }

    #[Test]
    public function test_create_snapshot_with_voice_file_and_transcription()
    {
        Storage::fake('local');
        
        $session = FocusSession::factory()->create(['user_id' => $this->user->id]);
        $voiceFile = UploadedFile::fake()->create('memo.mp3', 100);
        
        $this->mockTranscriptionService->shouldReceive('transcribe')
            ->once()
            ->andReturn('Transcribed text content');
            
        $data = ['note' => 'Note'];
        
        $snapshot = $this->service->processSnapshot($session, $data, $voiceFile);
        
        $this->assertNotNull($snapshot->voice_memo_path);
        $this->assertEquals('Transcribed text content', $snapshot->voice_transcript);
        Storage::disk('local')->assertExists($snapshot->voice_memo_path); 
    }

    #[Test]
    public function test_fork_snapshot_creates_replica_for_new_session()
    {
        $originalSession = FocusSession::factory()->create(['user_id' => $this->user->id]);
        $originalSnapshot = \App\Models\ContextSnapshot::factory()->create([
            'user_id' => $this->user->id,
            'focus_session_id' => $originalSession->id,
            'text_note' => 'Original Note',
            'browser_state' => [['url' => 'example.com']],
        ]);

        $newSession = FocusSession::factory()->create(['user_id' => $this->user->id]);

        $forked = $this->service->forkSnapshot($originalSnapshot, $newSession);

        $this->assertNotEquals($originalSnapshot->id, $forked->id);
        $this->assertEquals($newSession->id, $forked->focus_session_id);
        $this->assertEquals('forked', $forked->type);
        $this->assertEquals('Original Note', $forked->text_note);
        // Verify Deep Copy of arrays? Replicate converts arrays.
        $this->assertEquals($originalSnapshot->browser_state, $forked->browser_state);
        
        // Verify link updated on new session
        $this->assertEquals($forked->id, $newSession->fresh()->context_snapshot_id);
    }
}
