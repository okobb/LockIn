<?php

declare(strict_types=1);

namespace App\Services;

class ToolService
{
    /**
     * Get the definitions for task management tools.
     *
     * @return array
     */
    public function getTaskTools(): array
    {
        return [
            [
                'type' => 'function',
                'function' => [
                    'name' => 'create_task',
                    'description' => 'Create a new task for the user.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'title' => ['type' => 'string', 'description' => 'The title of the task'],
                            'priority' => ['type' => 'string', 'enum' => ['low', 'medium', 'high', 'urgent']],
                            'due_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD format or null'],
                        ],
                        'required' => ['title'],
                    ],
                ]
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'update_task',
                    'description' => 'Update an existing task.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'task_id' => ['type' => 'string', 'description' => 'The ID of the task to update'],
                            'fields' => [
                                'type' => 'object',
                                'properties' => [
                                    'title' => ['type' => 'string'],
                                    'status' => ['type' => 'string', 'enum' => ['todo', 'in_progress', 'done']],
                                    'priority' => ['type' => 'string'],
                                ],
                            ],
                        ],
                        'required' => ['task_id', 'fields'],
                    ],
                ]
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'complete_task',
                    'description' => 'Mark a task as complete.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'task_id' => ['type' => 'string', 'description' => 'The ID of the task to complete'],
                        ],
                        'required' => ['task_id'],
                    ],
                ]
            ]
        ];
    }
}
