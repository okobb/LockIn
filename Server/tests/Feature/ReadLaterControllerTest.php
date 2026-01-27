<?php

namespace Tests\Feature;

use App\Models\KnowledgeResource;
use App\Models\ReadLaterQueue;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReadLaterControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private KnowledgeResource $resource;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->resource = KnowledgeResource::factory()->create([
            'user_id' => $this->user->id,
            'title' => 'Test Article',
            'estimated_time_minutes' => 15,
        ]);
    }

    public function test_can_get_suggestions()
    {
        $user = User::factory()->create();
        
        $response = $this->actingAs($user, 'api')
            ->getJson('/api/read-later/suggestions');

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'success', 'message']);
    }

    public function test_can_add_resource_to_queue()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/read-later', [
                'resource_id' => $this->resource->id,
                'gap_type' => '15min_break',
                'estimated_minutes' => 20, // Override default
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.resource_id', $this->resource->id)
            ->assertJsonPath('data.gap_type', '15min_break')
            ->assertJsonPath('data.estimated_minutes', 20);

        $this->assertDatabaseHas('read_later_queue', [
            'user_id' => $this->user->id,
            'resource_id' => $this->resource->id,
        ]);
    }

    public function test_can_list_queue()
    {
        ReadLaterQueue::create([
            'user_id' => $this->user->id,
            'resource_id' => $this->resource->id,
            'gap_type' => 'commute',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/read-later');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.gap_type', 'commute');
    }

    public function test_can_remove_from_queue()
    {
        $item = ReadLaterQueue::create([
            'user_id' => $this->user->id,
            'resource_id' => $this->resource->id,
        ]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/read-later/{$item->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('read_later_queue', ['id' => $item->id]);
    }

    public function test_can_mark_complete()
    {
        $item = ReadLaterQueue::create([
            'user_id' => $this->user->id,
            'resource_id' => $this->resource->id,
        ]);

        $response = $this->actingAs($this->user)
            ->patchJson("/api/read-later/{$item->id}/complete");

        $response->assertStatus(200);
        $this->assertDatabaseHas('read_later_queue', [
            'id' => $item->id,
            'is_completed' => true,
        ]);
    }
}
