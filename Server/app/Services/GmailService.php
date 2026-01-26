<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ServiceException;
use App\Models\IncomingMessage;
use App\Models\Integration;
use App\Services\Traits\UsesIntegrationTokens;
use Illuminate\Support\Collection;

require_once __DIR__ . '/../consts.php';

/**
 * Service for interacting with Gmail API.
 */
final class GmailService
{
    use UsesIntegrationTokens;

    private const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';

    public function __construct(
        private readonly IntegrationService $integrationService,
        private readonly IncomingMessageService $incomingMessageService,
        private readonly ClassificationService $classificationService
    ) {}

    /**
     * Fetch recent messages and store them in the database.
     *
     * @return Collection<int, IncomingMessage>
     * @throws ServiceException
     */
    public function syncAndStoreMessages(int $userId, int $maxResults = 20): Collection
    {
        $messages = $this->fetchRecentMessages($userId, $maxResults);
        $stored = collect();

        foreach ($messages as $message) {
            $externalId = $message['id'] ?? null;
            if (!$externalId) {
                continue;
            }

            // Skip if already exists (deduplication)
            $exists = IncomingMessage::query()->where('external_id', $externalId)
                ->where('provider', 'gmail')
                ->where('user_id', $userId)
                ->exists();

            if ($exists) {
                continue;
            }

            // Build content from subject + body (with snippet as fallback)
            $body = $message['body'] ?? '';
            $content = "Subject: " . ($message['subject'] ?? 'No Subject') . "\n\n";
            $content .= $body ?: ($message['snippet'] ?? '');

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
                'provider' => 'gmail',
                'external_id' => $externalId,
                'sender_info' => $message['from'] ?? 'Unknown',
                'channel_info' => $message['subject'] ?? 'No Subject',
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
            ['format' => 'full'],
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
        $body = $this->extractBody($data['payload'] ?? []);

        return [
            'id' => $data['id'] ?? null,
            'thread_id' => $data['threadId'] ?? null,
            'subject' => $headers->firstWhere('name', 'Subject')['value'] ?? 'No Subject',
            'from' => $headers->firstWhere('name', 'From')['value'] ?? 'Unknown',
            'date' => $headers->firstWhere('name', 'Date')['value'] ?? null,
            'snippet' => $data['snippet'] ?? '',
            'body' => $body,
            'label_ids' => $data['labelIds'] ?? [],
        ];
    }

    /**
     * Extract the plain text body from Gmail message payload.
     *
     * @param array<string, mixed> $payload
     * @return string
     */
    private function extractBody(array $payload): string
    {
        // Simple message with body in payload
        if (isset($payload['body']['data'])) {
            return $this->decodeBody($payload['body']['data']);
        }

        // Multipart message - look for text/plain part
        if (isset($payload['parts'])) {
            foreach ($payload['parts'] as $part) {
                // Prefer text/plain
                if (($part['mimeType'] ?? '') === 'text/plain' && isset($part['body']['data'])) {
                    return $this->decodeBody($part['body']['data']);
                }
                // Recursively check nested parts
                if (isset($part['parts'])) {
                    $nestedBody = $this->extractBody($part);
                    if ($nestedBody) {
                        return $nestedBody;
                    }
                }
            }
            // Fallback to text/html if no plain text
            foreach ($payload['parts'] as $part) {
                if (($part['mimeType'] ?? '') === 'text/html' && isset($part['body']['data'])) {
                    return strip_tags($this->decodeBody($part['body']['data']));
                }
            }
        }

        return '';
    }

    /**
     * Decode base64url encoded Gmail body.
     */
    private function decodeBody(string $data): string
    {
        // Gmail uses URL-safe base64
        $data = str_replace(['-', '_'], ['+', '/'], $data);
        return base64_decode($data) ?: '';
    }
}
