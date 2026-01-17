<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\RAGService;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Mockery;

class KnowledgeAskTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_ask_question(): void
    {
        /** @var \App\Models\User $user */
        $user = User::factory()->create();
        $this->actingAs($user, 'api');

        // Mock RAGService
        $mockRag = Mockery::mock(RAGService::class);
        $mockRag->shouldReceive('ask')
            ->once()
            ->with($user->id, 'How do I center a div?')
            ->andReturn([
                'answer' => 'Use flexbox or grid.',
                'sources' => [
                    ['content' => 'CSS Flexbox Guide...'],
                    ['content' => 'CSS Grid Guide...'],
                ],
            ]);

        $this->instance(RAGService::class, $mockRag);

        $response = $this->postJson('/api/knowledge/ask', [
            'question' => 'How do I center a div?',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'answer' => 'Use flexbox or grid.',
                'sources' => [
                    ['content' => 'CSS Flexbox Guide...'],
                    ['content' => 'CSS Grid Guide...'],
                ],
            ]);
    }

    public function test_validates_request(): void
    {
        /** @var \App\Models\User $user */
        $user = User::factory()->create();
        $this->actingAs($user, 'api');

        $response = $this->postJson('/api/knowledge/ask', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['question']);
    }
}
