<?php

namespace Tests\Feature;

use App\Models\KnowledgeResource;
use App\Models\User;
use App\Services\AIService;
use App\Services\ResourceHubService;
use App\Services\UrlMetadataService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Tests\TestCase;

class ResourceHubTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        
        // Ensure signed middleware is available
        $this->app['router']->aliasMiddleware('signed', \Illuminate\Routing\Middleware\ValidateSignature::class);
        
        \Illuminate\Support\Facades\URL::forceRootUrl('http://localhost');
    }

    public function test_can_create_resource_from_url()
    {
        $this->actingAs($this->user);

        // Mock UrlMetadataService
        $this->mock(UrlMetadataService::class, function ($mock) {
            $mock->shouldReceive('fetchMetadata')
                ->once()
                ->andReturn([
                    'title' => 'Test Title',
                    'description' => 'Test Description',
                    'image' => 'http://example.com/image.jpg',
                    'domain' => 'example.com',
                    'type' => \RESOURCE_TYPE_ARTICLE,
                ]);
        });

        $this->mock(AIService::class, function ($mock) {
        });

        $response = $this->postJson('/api/resources', [
            'url' => 'http://example.com/article',
            'tags' => ['php', 'testing'],
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'title' => 'Test Title',
                'url' => 'http://example.com/article',
                'type' => \RESOURCE_TYPE_ARTICLE,
                'source_domain' => 'example.com',
            ]);

        $this->assertDatabaseHas('knowledge_resources', [
            'user_id' => $this->user->id,
            'url' => 'http://example.com/article',
            'is_read' => false,
        ]);
    }

    public function test_can_create_resource_from_file()
    {
        $this->withoutExceptionHandling();
        Storage::fake('public');
        $this->actingAs($this->user);

        $file = UploadedFile::fake()->create('document.pdf', 100);

        $response = $this->postJson('/api/resources', [
            'file' => $file,
            'tags' => ['docs'],
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'title' => 'document.pdf',
                'type' => \RESOURCE_TYPE_DOCUMENT,
            ]);

        $resource = KnowledgeResource::first();
        Storage::disk('public')->assertExists($resource->file_path);
    }

    public function test_can_list_resources_with_filters()
    {
        $this->actingAs($this->user);

        KnowledgeResource::factory()->create([
            'user_id' => $this->user->id,
            'title' => 'React Guide',
            'type' => \RESOURCE_TYPE_ARTICLE,
            'is_read' => false,
        ]);

        KnowledgeResource::factory()->create([
            'user_id' => $this->user->id,
            'title' => 'Vue Video',
            'type' => \RESOURCE_TYPE_VIDEO,
            'is_read' => true,
        ]);

        // Filter by Type
        $response = $this->getJson('/api/resources?type=' . \RESOURCE_TYPE_VIDEO);
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['title' => 'Vue Video']);

        // Filter by Status (Unread)
        $response = $this->getJson('/api/resources?status=unread');
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['title' => 'React Guide']);

        // Search
        $response = $this->getJson('/api/resources?search=React');
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['title' => 'React Guide']);
    }

    public function test_can_toggle_favorite()
    {
        $this->actingAs($this->user);
        $resource = KnowledgeResource::factory()->create([
            'user_id' => $this->user->id,
            'is_favorite' => false,
        ]);

        $response = $this->postJson("/api/resources/{$resource->id}/favorite");
        
        $response->assertStatus(200)
            ->assertJson(['is_favorite' => true]);
            
        $this->assertDatabaseHas('knowledge_resources', [
            'id' => $resource->id,
            'is_favorite' => true,
        ]);
        
        // Toggle back
        $this->postJson("/api/resources/{$resource->id}/favorite");
        $this->assertDatabaseHas('knowledge_resources', [
            'id' => $resource->id,
            'is_favorite' => false,
        ]);
    }
}