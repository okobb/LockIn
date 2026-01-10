<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ServiceException;
use App\Models\Integration;
use App\Services\Traits\UsesIntegrationTokens;

require_once __DIR__ . '/../consts.php';

/**
 * Service for interacting with Slack API.
 */
final class SlackService
{
    use UsesIntegrationTokens;

    private const SLACK_API_BASE = 'https://slack.com/api';

    public function __construct(
        private readonly IntegrationService $integrationService
    ) {}

    /**
     * Fetch recent messages from a channel.
     *
     * @return array<int, array<string, mixed>>
     * @throws ServiceException
     */
    public function fetchRecentMessages(int $userId, ?string $channel = null, int $limit = 20): array
    {
        $integration = $this->getSlackIntegration($userId);
        $integration = $this->integrationService->refreshTokenIfExpired($integration);

        // If no channel specified, get the first available channel
        if ($channel === null) {
            $channels = $this->listChannels($integration);
            $channel = $channels[0]['id'] ?? null;

            if ($channel === null) {
                return [];
            }
        }

        $response = $this->authenticatedGet(
            $integration,
            self::SLACK_API_BASE . '/conversations.history',
            [
                'channel' => $channel,
                'limit' => min($limit, 100),
            ],
            'Failed to fetch Slack messages'
        );

        $data = $response->json();

        if (!($data['ok'] ?? false)) {
            throw new ServiceException(
                message: 'Slack API error: ' . ($data['error'] ?? 'Unknown error'),
                code: 400
            );
        }

        return array_map(
            fn ($msg) => $this->parseMessage($msg, $channel),
            $data['messages'] ?? []
        );
    }

    /**
     * List channels the user has access to.
     *
     * @return array<int, array<string, mixed>>
     * @throws ServiceException
     */
    public function listChannels(Integration $integration): array
    {
        $response = $this->authenticatedGet(
            $integration,
            self::SLACK_API_BASE . '/conversations.list',
            ['types' => 'public_channel,private_channel,im,mpim', 'limit' => 100],
            'Failed to list Slack channels'
        );

        $data = $response->json();

        if (!($data['ok'] ?? false)) {
            throw new ServiceException(
                message: 'Slack API error: ' . ($data['error'] ?? 'Unknown error'),
                code: 400
            );
        }

        return array_map(fn ($ch) => [
            'id' => $ch['id'],
            'name' => $ch['name'] ?? $ch['id'],
            'is_private' => $ch['is_private'] ?? false,
            'is_im' => $ch['is_im'] ?? false,
        ], $data['channels'] ?? []);
    }

    /**
     * Get Slack integration for a user.
     *
     * @throws ServiceException
     */
    private function getSlackIntegration(int $userId): Integration
    {
        $integration = $this->integrationService->getActiveIntegration($userId, PROVIDER_SLACK);

        if ($integration === null) {
            throw new ServiceException(
                message: 'Slack not connected',
                code: 400
            );
        }

        return $integration;
    }

    /**
     * Parse Slack message into simplified format.
     *
     * @param array<string, mixed> $msg
     * @return array<string, mixed>
     */
    private function parseMessage(array $msg, string $channel): array
    {
        return [
            'id' => $msg['ts'] ?? null,
            'channel' => $channel,
            'user' => $msg['user'] ?? null,
            'text' => $msg['text'] ?? '',
            'timestamp' => $msg['ts'] ?? null,
            'type' => $msg['type'] ?? 'message',
        ];
    }
}
