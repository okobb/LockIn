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
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'list_resources',
                    'description' => 'List saved learning resources like articles, PDFs, videos, or bookmarks. Use only when user explicitly asks about "saved resources", "documents", "articles", or "knowledge base". NOT for tasks or projects.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'limit' => ['type' => 'integer', 'description' => 'Maximum number of resources to return (default 10)'],
                        ],
                        'required' => [],
                    ],
                ]
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'list_tasks',
                    'description' => 'List the user\'s tasks, projects, or to-dos. Use this for action-oriented queries like "what should I work on", "my projects", "show my tasks". This is for WORK ITEMS, not saved documents.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'status' => ['type' => 'string', 'enum' => ['todo', 'in_progress', 'done'], 'description' => 'Filter by status (optional)'],
                            'limit' => ['type' => 'integer', 'description' => 'Max tasks to return (default 10)'],
                        ],
                        'required' => [],
                    ],
                ]
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'delete_resource',
                    'description' => 'Delete a resource from the knowledge base by ID.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'resource_id' => ['type' => 'integer', 'description' => 'The ID of the resource to delete'],
                        ],
                        'required' => ['resource_id'],
                    ],
                ]
            ]
        ];
    }
}
