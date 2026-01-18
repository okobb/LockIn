<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class TaskSuggestionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_suggestions_matching_query()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        // Create tasks
        Task::factory()->create([
            'user_id' => $user->id,
            'title' => 'Fix Mission Bar',
            'status' => 'open',
        ]);

        Task::factory()->create([
            'user_id' => $user->id,
            'title' => 'Another Task',
            'status' => 'open',
        ]);

        // Closed task shouldn't appear
        Task::factory()->create([
            'user_id' => $user->id,
            'title' => 'Fix Old Mission Bar',
            'status' => 'done',
        ]);

        // Task for another user shouldn't appear
        Task::factory()->create([
            'user_id' => User::factory()->create()->id,
            'title' => 'Fix Mission Bar for Someone Else',
            'status' => 'open',
        ]);

        $response = $this->getJson(route('tasks.suggestions', ['query' => 'fix mission']));
        $response->assertSuccessful();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonFragment(['title' => 'Fix Mission Bar']);

        $response->assertJsonMissing(['title' => 'Another Task']);
        $response->assertJsonMissing(['title' => 'Fix Old Mission Bar']);
        $response->assertJsonMissing(['title' => 'Fix Mission Bar for Someone Else']);
    }

    public function test_it_handles_case_insensitive_search()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        Task::factory()->create([
            'user_id' => $user->id,
            'title' => 'UPPERCASE TASK',
            'status' => 'open',
        ]);

        $response = $this->getJson(route('tasks.suggestions', ['query' => 'upper']));

        $response->assertSuccessful();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonFragment(['title' => 'UPPERCASE TASK']);

    }
}
