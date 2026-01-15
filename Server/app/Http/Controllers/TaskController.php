<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Task\IndexTaskRequest;
use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class TaskController extends BaseController
{
    public function __construct(
        private readonly TaskService $taskService
    ) {}

    /**
     * List tasks for the authenticated user.
     */
    public function index(IndexTaskRequest $request): AnonymousResourceCollection
    {
        $tasks = $this->taskService->getForUser(
            $request->user()->id,
            $request->input('status', 'open'),
            $request->input('scheduled')
        );

        return TaskResource::collection($tasks);
    }

    /**
     * Store a new task.
     */
    public function store(StoreTaskRequest $request): JsonResponse
    {
        $task = $this->taskService->createForUser(
            $request->user()->id,
            $request->validated()
        );

        return $this->createdResponse(new TaskResource($task), 'Task created successfully');
    }

    /**
     * Get a single task.
     */
    public function show(Request $request, Task $task): JsonResponse
    {
        if ($task->user_id !== $request->user()->id) {
            return $this->forbiddenResponse('You do not own this task');
        }

        return $this->successResponse(new TaskResource($task));
    }

    /**
     * Update a task.
     */
    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $updatedTask = $this->taskService->updateTask($task, $request->validated());

        return $this->successResponse(new TaskResource($updatedTask), 'Task updated successfully');
    }

    /**
     * Delete a task (soft delete).
     */
    public function destroy(Request $request, Task $task): JsonResponse
    {
        if ($task->user_id !== $request->user()->id) {
            return $this->forbiddenResponse('You do not own this task');
        }

        Task::destroy($task->id);

        return $this->successResponse(null, 'Task deleted successfully');
    }
    /**
     * Get task suggestions for autocomplete.
     */
    public function suggestions(Request $request): JsonResponse
    {
        $suggestions = $this->taskService->getSuggestions(
            $request->user()->id,
            $request->input('query')
        );

        return $this->successResponse($suggestions->map(fn($task) => [
            'id' => $task->id,
            'title' => $task->title,
            'number' => $task->id // Using ID as number for now
        ]));
    }
}
