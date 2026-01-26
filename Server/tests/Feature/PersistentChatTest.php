<?php

namespace Tests\Feature;

use App\Models\ContextSnapshot;
use App\Models\User;
use App\Models\ChatThread;
use App\Models\ChatMessage;
use App\Services\AIService;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;

use App\Services\QdrantService;

class PersistentChatTest extends TestCase
{
    use RefreshDatabase;

    private $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create user
        $this->user = User::factory()->create();

        // Mock QdrantService
        $this->mock(QdrantService::class, function ($mock) {
            $mock->shouldReceive('search')
                ->andReturn([]);
        });

        // Mock AIService
        $this->mock(AIService::class, function ($mock) {
            $mock->shouldReceive('chatWithTools')
                ->andReturn([
                    'content' => 'This is a mocked AI response.',
                    'tool_calls' => []
                ]);
        });
    }

    public function test_global_chat_creates_global_thread_and_persists_messages()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/ai/chat', [
                'message' => 'Hello global world',
                'active_context_id' => null,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['thread_id', 'message_id', 'content']]);

        // Assert Thread Created
        $this->assertDatabaseHas('chat_threads', [
            'user_id' => $this->user->id,
            'context_id' => null,
            'title' => 'Global Thread', // from ChatService Logic
        ]);
        
        // ... (lines omitted)

    }

    public function test_context_chat_creates_context_thread_and_persists_messages()
    {

        $contextSnapshot = ContextSnapshot::create([
            'user_id' => $this->user->id,
            'context_hash' => 'hash123',
            'window_title' => 'Test Context',
            'app_name' => 'Visual Studio Code',
            'process_path' => 'code.exe',
            'content' => 'Some code',
            'captured_at' => now(),
        ]);
        
        $response = $this->actingAs($this->user)
            ->postJson('/api/ai/chat', [
                'message' => 'Hello specific context',
                'active_context_id' => (string)$contextSnapshot->id,
            ]);

        $response->assertStatus(200)
             ->assertJsonStructure(['data' => ['thread_id']]);

        // Assert Thread Created with Context ID
        $this->assertDatabaseHas('chat_threads', [
            'user_id' => $this->user->id,
            'context_id' => $contextSnapshot->id,
            'title' => 'Context Thread',
        ]);
    }

    public function test_get_thread_by_context_returns_correct_history()
    {
        $contextSnapshot = ContextSnapshot::create([
            'user_id' => $this->user->id,
            'context_hash' => 'hash123',
            'window_title' => 'Test Context',
            'app_name' => 'Visual Studio Code',
            'process_path' => 'code.exe',
            'content' => 'Some code',
            'captured_at' => now(),
        ]);

        $thread = ChatThread::create([
            'user_id' => $this->user->id,
            'context_id' => $contextSnapshot->id,
            'title' => 'Existing Context Thread',
        ]);

        $thread->messages()->create(['role' => 'user', 'content' => 'Old user message']);
        $thread->messages()->create(['role' => 'assistant', 'content' => 'Old ai message']);

        // 2. Call GET Endpoint
        $response = $this->actingAs($this->user)
            ->getJson("/api/ai/thread?context_id={$contextSnapshot->id}");

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['thread', 'messages']]);
        
        $data = $response->json('data');
        $this->assertEquals($thread->id, $data['thread']['id']);
        $this->assertCount(2, $data['messages']);
        $this->assertEquals('Old user message', $data['messages'][0]['content']);
    }
}
