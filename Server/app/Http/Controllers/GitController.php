<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\FocusSession;
use App\Models\Task;
use App\Services\GitHubService;
use Illuminate\Http\JsonResponse;

final class GitController extends BaseController
{
    public function __construct(
        private readonly GitHubService $gitHubService
    ) {}

    /**
     * Get Git status for a session's task.
     */
    public function show(FocusSession $session): JsonResponse
    {
        $task = Task::withTrashed()->find($session->task_id);
        
        // If no task or no source metadata, return empty state (not a git task)
        if (!$task || empty($task->source_metadata['repo'])) {
            return $this->successResponse(null);
        }

        $repo = $task->source_metadata['repo'];
        
        try {
            $changes = $this->gitHubService->getUncommittedChanges($repo, $session->user_id);
            
            $isEmpty = empty($changes) || (isset($changes['status']) && $changes['status'] === 'empty');
            if ($isEmpty && $task->source_type === 'github_pr') {
                return $this->successResponse([
                    'branch' => $task->source_metadata['branch'] ?? 'unknown',
                    'files_changed' => $task->source_metadata['files'] ?? [],
                    'additions' => $task->source_metadata['additions'] ?? 0,
                    'deletions' => $task->source_metadata['deletions'] ?? 0,
                    'repo' => $repo
                ]);
            }
            if ($isEmpty) {
                return $this->successResponse(null);
            }

            // Format for frontend
            return $this->successResponse([
                'branch' => $task->source_metadata['branch'] ?? 'unknown',
                'files_changed' => array_column($changes, 'file'),
                'additions' => array_sum(array_column($changes, 'additions')),
                'deletions' => array_sum(array_column($changes, 'deletions')),
                'repo' => $repo
            ]);
        } catch (\Exception $e) {
            return $this->successResponse(null);
        }
    }
}
