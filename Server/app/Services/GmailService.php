<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ServiceException;
use App\Models\Integration;
use App\Services\Traits\UsesIntegrationTokens;

require_once __DIR__ . '/../consts.php';

/**
 * Service for interacting with Gmail API.
 */
final class GmailService
{
    use UsesIntegrationTokens;

    private const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';

    public function __construct(
        private readonly IntegrationService $integrationService
    ) {}

    /**
     * Fetch recent messages for a user.
     *
     * @return array<int, array<string, mixed>>
     * @throws ServiceException
     */
    public function fetchRecentMessages(int $userId, int $maxResults = 20): array
    {
        $integration = $this->getGoogleIntegration($userId);
        $integration = $this->integrationService->refreshTokenIfExpired($integration);

        $response = $this->authenticatedGet(
            $integration,
            self::GMAIL_API_BASE . '/users/me/messages',
            [
                'maxResults' => min($maxResults, 100),
                'q' => 'is:unread OR newer_than:1d',
            ],
            'Failed to fetch Gmail messages'
        );

        $messageIds = $response->json('messages', []);

        // Fetch full message details for each message
        $messages = [];
        foreach (array_slice($messageIds, 0, $maxResults) as $msg) {
            $messages[] = $this->getMessage($integration, $msg['id']);
        }

        return $messages;
    }

    /**
     * Get a specific message by ID.
     *
     * @return array<string, mixed>
     * @throws ServiceException
     */
    public function getMessage(Integration $integration, string $messageId): array
    {
        $response = $this->authenticatedGet(
            $integration,
            self::GMAIL_API_BASE . "/users/me/messages/{$messageId}",
            ['format' => 'metadata', 'metadataHeaders' => ['Subject', 'From', 'Date']],
            'Failed to fetch Gmail message'
        );

        $data = $response->json();

        return $this->parseMessage($data);
    }

    /**
     * Get the Google integration for a user with Gmail scope.
     *
     * @throws ServiceException
     */
    private function getGoogleIntegration(int $userId): Integration
    {
        $integration = $this->integrationService->getActiveIntegration($userId, PROVIDER_GOOGLE);

        if ($integration === null) {
            throw new ServiceException(
                message: 'Gmail not connected',
                code: 400
            );
        }

        $scopes = $integration->scopes ?? [];
        $hasGmailScope = collect($scopes)->contains(fn ($scope) => 
            str_contains($scope, 'gmail')
        );

        if (!$hasGmailScope) {
            throw new ServiceException(
                message: 'Gmail scope not authorized. Please reconnect with Gmail permissions.',
                code: 403
            );
        }

        return $integration;
    }

    /**
     * Parse Gmail message response into a simplified format.
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function parseMessage(array $data): array
    {
        $headers = collect($data['payload']['headers'] ?? []);

        return [
            'id' => $data['id'] ?? null,
            'thread_id' => $data['threadId'] ?? null,
            'subject' => $headers->firstWhere('name', 'Subject')['value'] ?? 'No Subject',
            'from' => $headers->firstWhere('name', 'From')['value'] ?? 'Unknown',
            'date' => $headers->firstWhere('name', 'Date')['value'] ?? null,
            'snippet' => $data['snippet'] ?? '',
            'label_ids' => $data['labelIds'] ?? [],
        ];
    }
}
