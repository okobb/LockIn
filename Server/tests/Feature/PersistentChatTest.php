<?php

namespace Tests\Feature;

use App\Models\ContextSnapshot;
use App\Models\User;
use App\Models\ChatThread;
use App\Services\RAGService;
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
        
        $this->user = User::factory()->create();

        $this->mock(QdrantService::class, function ($mock) {
            $mock->shouldReceive('search')
                ->andReturn([]);
        });

        $this->mock(RAGService::class, function ($mock) {
            $mock->shouldReceive('chat')
                ->andReturn([
                    'type' => 'message',
                    'content' => 'This is a mocked AI response.',
                    'sources' => [],
                    'tool_call' => null,
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

        $this->assertDatabaseHas('chat_threads', [
            'user_id' => $this->user->id,
            'context_id' => null,
            'title' => 'Global Thread',
        ]);
        
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
