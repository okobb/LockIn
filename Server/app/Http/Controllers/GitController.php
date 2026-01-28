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
        $data = $this->gitHubService->getGitDataForSession($session);
        return $this->successResponse($data);
    }
}
