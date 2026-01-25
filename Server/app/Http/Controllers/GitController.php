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
        $session->load(['contextSnapshot']);

        if ($session->contextSnapshot) {
            $snapshot = $session->contextSnapshot;
            $hasGitData = !empty($snapshot->repository_source) || !empty($snapshot->git_branch);
            
            if ($hasGitData) {
                 return $this->successResponse([
                    'branch' => $snapshot->git_branch ?? 'unknown',
                    'files_changed' => $snapshot->git_files_changed ?? [],
                    'additions' => $snapshot->git_additions ?? 0,
                    'deletions' => $snapshot->git_deletions ?? 0,
                    'repo' => $snapshot->repository_source ?? 'Unknown',
                    'source' => 'snapshot' 
                ]);
            }
        }

        $task = Task::withTrashed()->find($session->task_id);
        $repo = $task?->source_metadata['repo'] ?? $task?->source_metadata['source_metadata']['repo'] ?? null;
        
        if (!$repo) {
            return $this->successResponse(null);
        }
        
        try {
            $changes = $this->gitHubService->getUncommittedChanges($repo, $session->user_id);
            
            $isEmpty = empty($changes) || (isset($changes['status']) && $changes['status'] === 'empty');
            if ($isEmpty && $task->source_type === 'github_pr') {
                return $this->successResponse([
                    'branch' => $task->source_metadata['branch'] ?? $task->source_metadata['source_metadata']['branch'] ?? 'unknown',
                    'files_changed' => $task->source_metadata['files'] ?? $task->source_metadata['source_metadata']['files'] ?? [],
                    'additions' => $task->source_metadata['additions'] ?? $task->source_metadata['source_metadata']['additions'] ?? 0,
                    'deletions' => $task->source_metadata['deletions'] ?? $task->source_metadata['source_metadata']['deletions'] ?? 0,
                    'repo' => $repo
                ]);
            }
            if ($isEmpty) {
                return $this->successResponse(null);
            }

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
