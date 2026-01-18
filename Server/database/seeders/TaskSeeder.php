<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use Carbon\Carbon;

class TaskSeeder extends Seeder
{
    public function run()
    {
        $user = User::first();
        
        if (!$user) {
            $user = User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);
        }

        $tasks = [
            [
                'title' => 'Fix Production Bug #123',
                'description' => 'Critical error in payment processing',
                'priority' => 1,
                'status' => 'open',
                'source_type' => 'github',
                'ai_reasoning' => 'Affects revenue stream',
                'estimated_minutes' => 120,
            ],
            [
                'title' => 'Review PR: Context Persistence',
                'description' => 'Review changes for session context saving',
                'priority' => 2,
                'status' => 'in_progress',
                'source_type' => 'github',
                'ai_reasoning' => 'Blocking release',
                'estimated_minutes' => 45,
            ],
            [
                'title' => 'Update Documentation',
                'description' => 'Update API docs for new endpoints',
                'priority' => 3,
                'status' => 'open',
                'source_type' => 'jira',
                'estimated_minutes' => 60,
            ],
            [
                'title' => 'Weekly Team Sync',
                'description' => 'Engineering team status update',
                'priority' => 3,
                'status' => 'open',
                'source_type' => 'calendar',
                'estimated_minutes' => 30,
            ],
            [
                'title' => 'Refactor FocusController',
                'description' => 'Clean up technical debt',
                'priority' => 4,
                'status' => 'done',
                'completed_at' => Carbon::parse('2024-03-20 14:30:00'),
                'estimated_minutes' => 90,
            ]
        ];

        foreach ($tasks as $task) {
            DB::table('tasks')->insert(array_merge($task, [
                'user_id' => $user->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }
}
