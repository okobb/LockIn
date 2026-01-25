<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ServiceException;
use App\Models\Integration;
use App\Models\Task;
use App\Models\User;
use App\Services\Traits\UsesIntegrationTokens;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Log;

require_once __DIR__ . '/../consts.php';

/**
 * Service for interacting with GitHub API and n8n webhooks.
 */
final class GitHubService
{
    use UsesIntegrationTokens;


    public function __construct(
        private readonly IntegrationService $integrationService,
        private readonly ContextSnapshotService $contextSnapshotService
    ) {}

    public function syncAndCreateTasksFromPRs(int $userId, TaskService $taskService): array
    {
        $integration = $this->getGitHubIntegration($userId);
        $integration = $this->integrationService->refreshTokenIfExpired($integration);
        $user = User::findOrFail($userId);

        $prs = $this->fetchUserPrs($integration);
        $createdTasks = [];

        foreach ($prs as $pr) {
            try {
                $createdTasks[] = $this->processPr($pr, $userId, $integration, $user, $taskService);
            } catch (\Exception $e) {
                Log::error("GitHub Sync: Failed to process PR #{$pr['number']}: " . $e->getMessage());
                continue;
            }
        }

        return [
            'synced' => count($createdTasks),
            'tasks' => $createdTasks,
        ];
    }

    /**
     * Fetch relevant PRs for the user.
     */
    private function fetchUserPrs(Integration $integration): array
    {
        $userResponse = $this->authenticatedGet(
            $integration,
            GITHUB_API_BASE . '/user',
            [],
            'Failed to fetch GitHub user info'
        );
        $githubUsername = $userResponse->json('login');
        Log::info("GitHub Sync: Authenticated as {$githubUsername}");

        $query = "is:pr is:open involves:@me";
        Log::info("GitHub Sync: Searching with query: {$query}");

        $searchResponse = $this->authenticatedGet(
            $integration,
            GITHUB_API_BASE . '/search/issues',
            [
                'q' => $query,
                'per_page' => 30,
            ],
            'Failed to search for review requests'
        );

        $prs = $searchResponse->json('items', []);
        Log::info("GitHub Sync: Found " . count($prs) . " PRs");

        return $prs;
    }

    /**
     * Process a single PR: sync task and context snapshot.
     */
    private function processPr(array $pr, int $userId, Integration $integration, User $user, TaskService $taskService): array
    {
        $externalId = 'github_pr_' . ($pr['id'] ?? $pr['number'] ?? uniqid());
        $metadata = $this->getPrMetadata($integration, $pr);

        $task = $this->updateOrCreateTask($userId, $externalId, $pr, $metadata, $user, $taskService);
        
        $this->contextSnapshotService->createForTask($task, $metadata);

        return [
            'id' => $task->id,
            'external_id' => $pr['id'],
            'number' => $pr['number'],
            'title' => $pr['title'],
            'repo' => $metadata['repo'],
            'branch' => $metadata['branch'],
            'state' => $metadata['state'],
            'pr_url' => $pr['html_url'],
            'additions' => $metadata['additions'],
            'deletions' => $metadata['deletions'],
        ];
    }

    private function getPrMetadata(Integration $integration, array $pr): array
    {
        $repoUrl = $pr['repository_url'];

        $fullPrResponse = $this->authenticatedGet(
            $integration,
            $repoUrl . '/pulls/' . $pr['number'],
            [],
            'Failed to fetch full PR details'
        );
        $fullPr = $fullPrResponse->json();

        $prFilesResponse = $this->authenticatedGet(
            $integration,
            $repoUrl . '/pulls/' . $pr['number'] . '/files',
            ['per_page' => 100],
            'Failed to fetch PR files'
        );
        $prFiles = $this->formatChanges($prFilesResponse->json());

        return [
            'repo' => $fullPr['base']['repo']['name'] ?? 'Unknown',
            'number' => $fullPr['number'],
            'branch' => $fullPr['head']['ref'] ?? 'unknown',
            'state' => $fullPr['state'],
            'additions' => $fullPr['additions'] ?? 0,
            'deletions' => $fullPr['deletions'] ?? 0,
            'sender' => $fullPr['user']['login'] ?? 'Unknown',
            'files' => array_column($prFiles, 'file'),
        ];
    }

    private function updateOrCreateTask(
        int $userId, 
        string $externalId, 
        array $pr, 
        array $metadata, 
        User $user, 
        TaskService $taskService
    ): Task {
        $existingTask = Task::withTrashed()
            ->where('external_id', '=', $externalId)
            ->where('user_id', '=', $userId)
            ->first();

        if ($existingTask) {
            if ($existingTask->trashed()) {
                $existingTask->restore();
            }
            $existingTask->update(['source_metadata' => $metadata]);
            Log::info("GitHub Sync: Updated metadata for task PR #{$pr['number']} ({$externalId})");
            return $existingTask;
        }

        return $taskService->createFromWebhookPayload([
            'title' => $pr['title'] ?? 'Review PR',
            'description' => $this->formatPRDescription($pr),
            'source_type' => 'github_pr',
            'source_link' => $pr['html_url'] ?? null,
            'external_id' => $externalId,
            'priority' => 'normal',
            ...$metadata
        ], $user);
    }

    /**
     * Format PR description for task.
     */
    private function formatPRDescription(array $pr): string
    {
        $body = $pr['body'] ?? '';
        $repoName = $pr['repository_url'] ?? '';
        $repoName = basename($repoName);
        
        $description = "**Repository:** {$repoName}\n";
        $description .= "**PR:** #{$pr['number']}\n";
        $description .= "**Author:** " . ($pr['user']['login'] ?? 'Unknown') . "\n\n";
        
        if ($body) {
            $description .= "---\n" . $body;
        }

        return $description;
    }

    /**
     * Create an empty state response.
     *
     * @return array{status: string, message: string}
     */
    private function emptyState(string $message): array
    {
        return [
            'status' => 'empty',
            'message' => $message,
        ];
    }

    /**
     * Get the user's most recently active repository.
     */
    public function getLatestActiveRepo(int $userId): array
    {
        $integration = $this->getGitHubIntegration($userId);
        $integration = $this->integrationService->refreshTokenIfExpired($integration);

        $response = $this->authenticatedGet(
            $integration,
            GITHUB_API_BASE . '/user/repos',
            [
                'sort' => 'pushed',
                'direction' => 'desc',
                'per_page' => 10, 
            ],
            'Failed to fetch GitHub repositories'
        );

        $repos = $response->json();

        if (empty($repos) || !is_array($repos)) {
            return $this->emptyState('No repositories found');
        }

        // Get the authenticated user's login to filter repos
        $userResponse = $this->authenticatedGet(
            $integration,
            GITHUB_API_BASE . '/user',
            [],
            'Failed to fetch GitHub user info'
        );

        $githubUsername = $userResponse->json('login');

        $ownedRepos = array_filter($repos, function ($repo) use ($githubUsername) {
            return isset($repo['owner']['login']) && $repo['owner']['login'] === $githubUsername;
        });

        $latestRepo = reset($ownedRepos) ?: reset($repos);

        if (!$latestRepo) {
            return $this->emptyState('No active repositories found');
        }

        return [
            'status' => 'ok',
            'name' => $latestRepo['full_name'] ?? $latestRepo['name'] ?? 'Unknown',
            'description' => $latestRepo['description'] ?? null,
            'url' => $latestRepo['html_url'] ?? null,
            'pushed_at' => $latestRepo['pushed_at'] ?? null,
            'language' => $latestRepo['language'] ?? null,
            'default_branch' => $latestRepo['default_branch'] ?? 'main',
        ];
    }

    /**
     * Get uncommitted/recent changes for a repository via n8n webhook.
     * @return array<int, array{file: string, additions: int, deletions: int}>|array{status: string, message: string}
     * @throws ServiceException
     */
    public function getUncommittedChanges(string $repoName, int $userId): array
    {
        $integration = $this->getGitHubIntegration($userId);
        $integration = $this->integrationService->refreshTokenIfExpired($integration);

        $webhookUrl = config('services.n8n.github_webhook_url');

        if (empty($webhookUrl)) {
            throw new ServiceException(
                message: 'n8n GitHub webhook URL not configured',
                code: 500
            );
        }

        /** @var Response $response */
        $response = \Illuminate\Support\Facades\Http::withHeaders([
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $integration->access_token,
        ])->post($webhookUrl, [
            'github_token' => $integration->access_token,
            'repo_name' => $repoName,
            'user_id' => $userId,
        ]);

        if ($response->failed()) {
            return $this->emptyState('Unable to fetch changes from n8n workflow');
        }

        $data = $response->json();

        if ($data === null || (is_array($data) && empty($data))) {
            return $this->emptyState('No active work detected');
        }

        if (is_array($data) && isset($data['status']) && $data['status'] === 'error') {
            return $this->emptyState($data['message'] ?? 'n8n returned an error');
        }

        return $this->formatChanges($data);
    }

    /**
     * Get GitHub integration for a user.
     *
     * @throws ServiceException
     */
    private function getGitHubIntegration(int $userId): Integration
    {
        $integration = $this->integrationService->getActiveIntegration($userId, PROVIDER_GITHUB);

        if ($integration === null) {
            throw new ServiceException(
                message: 'GitHub not connected',
                code: 400
            );
        }

        return $integration;
    }

    /**
     * Format changes array to consistent output format.
     * [{ "file": "path/to/file.php", "additions": 10, "deletions": 5 }, ...]
     * 
     * @param array<mixed> $data Raw data from n8n
     * @return array<int, array{file: string, additions: int, deletions: int}>
     */
    private function formatChanges(array $data): array
    {
        // Normalize the input:
        $items = $data['files'] ?? $data;

        if (!is_array($items)) {
            return [];
        }

        return array_values(array_map(fn($item) => [
            'file' => $item['file'] ?? $item['filename'] ?? $item['path'] ?? 'unknown',
            'additions' => (int) ($item['additions'] ?? $item['added'] ?? 0),
            'deletions' => (int) ($item['deletions'] ?? $item['removed'] ?? $item['deleted'] ?? 0),
        ], $items));
    }
}
