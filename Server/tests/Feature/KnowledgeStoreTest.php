<?php

namespace Tests\Feature;

use App\Models\KnowledgeResource;
use App\Models\User;
use App\Services\RAGService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Mockery;

class KnowledgeStoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_store_resource(): void
    {
        /** @var \App\Models\User $user */
        $user = User::factory()->create();
        $this->actingAs($user, 'api');

        $mockRag = Mockery::mock(RAGService::class);
        $mockRag->shouldReceive('createResource')
            ->once()
            ->andReturn(new KnowledgeResource([
                'id' => 1,
                'user_id' => $user->id,
                'url' => 'http://example.com',
                'title' => 'Example',
                'content_text' => 'Content',
            ]));

        $this->instance(RAGService::class, $mockRag);

        $response = $this->postJson('/api/knowledge', [
            'url' => 'http://example.com',
            'title' => 'Example',
            'content' => 'Content',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'url' => 'http://example.com',
                ],
            ]);
    }
}
