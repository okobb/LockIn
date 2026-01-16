<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\FocusSession;
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
        $task = $session->task;
        
        // If no task or no source metadata, return empty state (not a git task)
        if (!$task || empty($task->source_metadata['repo'])) {
            return $this->successResponse(null);
        }

        $repo = $task->source_metadata['repo'];
        $repoOwner = $task->source_metadata['owner'] ?? null; 
        
        try {
            $changes = $this->gitHubService->getUncommittedChanges($repo, $session->user_id);
            
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
