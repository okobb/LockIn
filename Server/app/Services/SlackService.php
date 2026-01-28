<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ServiceException;
use App\Models\IncomingMessage;
use App\Models\Integration;
use App\Services\Traits\UsesIntegrationTokens;
use Exception;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

require_once __DIR__ . '/../consts.php';

/**
 * Service for interacting with Slack API.
 */
final class SlackService
{
    use UsesIntegrationTokens;

    private const SLACK_API_BASE = 'https://slack.com/api';

    public function __construct(
        private readonly IntegrationService $integrationService,
        private readonly IncomingMessageService $incomingMessageService,
        private readonly ClassificationService $classificationService
    ) {}

    /**
     * Fetch recent messages and store them in the database.
     * If no channel is specified, syncs from all channels.
     *
     * @return Collection<int, IncomingMessage>
     * @throws ServiceException
     */
    public function syncAndStoreMessages(int $userId, ?string $channel = null, int $limit = 20): Collection
    {
        $stored = collect();

        if ($channel !== null) {
            // Sync specific channel
            $messages = $this->fetchRecentMessages($userId, $channel, $limit);
            $stored = $stored->merge($this->storeMessages($userId, $messages));
        } else {
            $integration = $this->getSlackIntegration($userId);
            $integration = $this->integrationService->refreshTokenIfExpired($integration);
            $channels = $this->listChannels($integration);

            foreach ($channels as $ch) {
                try {
                    $messages = $this->fetchRecentMessages($userId, $ch['id'], $limit);
                    $stored = $stored->merge($this->storeMessages($userId, $messages));
                } catch (\Exception $e) {
                    Log::warning("Failed to sync Slack channel {$ch['id']}: " . $e->getMessage());
                }
            }
        }

        return $stored;
    }

    /**
     * Store messages in the database, avoiding duplicates.
     *
     * @param array<int, array<string, mixed>> $messages
     * @return Collection<int, IncomingMessage>
     */
    private function storeMessages(int $userId, array $messages): Collection
    {
        $stored = collect();

        foreach ($messages as $message) {
            $externalId = $message['id'] ?? null;
            if (!$externalId) {
                continue;
            }

            // Skip if already exists (deduplication)
            $exists = IncomingMessage::query()->where('external_id', $externalId)
                ->where('provider', 'slack')
                ->where('user_id', $userId)
                ->exists();

            if ($exists) {
                continue;
            }

            $content = $message['content_raw'] ?? '';
            
            if (strlen($content) < 5) {
                continue; 
            }

            $classification = $this->classificationService->classify($content);
            $isImportant = $classification['is_important'] ?? true; 
            $confidence = $classification['confidence'] ?? 0.0;
            $tag = $classification['tag'] ?? 'unknown';

            $status = $isImportant ? 'pending' : 'skipped';
            $decisionReason = $isImportant 
                ? null 
                : "ML classified as Noise ({$tag}, " . number_format($confidence * 100, 1) . "%)";

            $incomingMessage = $this->incomingMessageService->create([
                'user_id' => $userId,
                'provider' => 'slack',
                'external_id' => $externalId,
                'sender_info' => $message['sender_info'] ?? 'Unknown',
                'channel_info' => $message['channel_info'] ?? null,
                'content_raw' => $content,
                'status' => $status,
                'decision_reason' => $decisionReason,
                'urgency_score' => $confidence,
                'received_at' => now(),
            ]);

            $stored->push($incomingMessage);
        }

        return $stored;
    }

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

        $messages = array_filter(
            $data['messages'] ?? [],
            fn ($msg) => !isset($msg['subtype']) || $msg['subtype'] === 'bot_message'
        );

        $userCache = [];
        $result = [];
        foreach ($messages as $msg) {
            $userId = $msg['user'] ?? null;
            if ($userId && !isset($userCache[$userId])) {
                $userCache[$userId] = $this->resolveUserName($integration, $userId);
            }
            $parsed = $this->parseMessage($msg, $channel);
            $parsed['user_name'] = $userCache[$userId] ?? $parsed['user'];
            $parsed['text'] = $this->resolveUserMentions($integration, $parsed['text'], $userCache);
            $result[] = $parsed;
        }

        return $result;
    }

    /**
     * Resolve a Slack user ID to their display name.
     */
    private function resolveUserName(Integration $integration, string $userId): string
    {
        try {
            $response = $this->authenticatedGet(
                $integration,
                self::SLACK_API_BASE . '/users.info',
                ['user' => $userId],
                'Failed to fetch user info'
            );

            $data = $response->json();
            if ($data['ok'] ?? false) {
                return $data['user']['profile']['display_name']
                    ?: $data['user']['profile']['real_name']
                    ?: $data['user']['name']
                    ?? $userId;
            }
        } catch (Exception $e) {
        }

        return $userId;
    }

    /**
     * Replace @mentions in text with actual usernames.
     *
     * @param array<string, string> $userCache
     */
    private function resolveUserMentions(Integration $integration, string $text, array &$userCache): string
    {
        return preg_replace_callback(
            '/<@([A-Z0-9]+)>/',
            function ($matches) use ($integration, &$userCache) {
                $userId = $matches[1];
                if (!isset($userCache[$userId])) {
                    $userCache[$userId] = $this->resolveUserName($integration, $userId);
                }
                return '@' . $userCache[$userId];
            },
            $text
        ) ?? $text;
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
