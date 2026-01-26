<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;

class TaskControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    #[Test]
    public function test_authenticated_user_can_create_task()
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/tasks', [
                'title' => 'New Feature Task',
                'description' => 'Description here',
                'priority_label' => 'high',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.title', 'New Feature Task')
            ->assertJsonPath('data.description', 'Description here');

        $this->assertDatabaseHas('tasks', [
            'user_id' => $this->user->id,
            'title' => 'New Feature Task',
        ]);
    }

    #[Test]
    public function test_authenticated_user_can_update_task()
    {
        $task = Task::factory()->create([
            'user_id' => $this->user->id,
            'title' => 'Old Title',
            'status' => 'open',
        ]);

        $response = $this->actingAs($this->user)
            ->patchJson("/api/tasks/{$task->id}", [
                'title' => 'Updated Title',
                'status' => 'in_progress',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.title', 'Updated Title')
            ->assertJsonPath('data.status', 'in_progress');

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'title' => 'Updated Title',
            'status' => 'in_progress',
        ]);
    }

    #[Test]
    public function test_marking_task_done_records_completion()
    {
        $task = Task::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'open',
        ]);

        $this->actingAs($this->user)
            ->patchJson("/api/tasks/{$task->id}", ['status' => 'done'])
            ->assertOk();

        $this->assertNotNull($task->fresh()->completed_at);
    }

    #[Test]
    public function test_unauthenticated_user_cannot_access_tasks()
    {
        $this->getJson('/api/tasks')
            ->assertUnauthorized();

        $this->postJson('/api/tasks', ['title' => 'Test'])
            ->assertUnauthorized();
    }

    #[Test]
    public function test_cannot_access_other_users_task()
    {
        $otherUser = User::factory()->create();
        $otherTask = Task::factory()->create(['user_id' => $otherUser->id]);

        $this->actingAs($this->user)
            ->getJson("/api/tasks/{$otherTask->id}")
            ->assertForbidden();

        $this->actingAs($this->user)
            ->patchJson("/api/tasks/{$otherTask->id}", ['title' => 'Hacked'])
            ->assertForbidden();
            
        $this->actingAs($this->user)
            ->deleteJson("/api/tasks/{$otherTask->id}")
            ->assertForbidden();
    }
}
