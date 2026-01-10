<?php

declare(strict_types=1);

namespace App\Services\Traits;

use App\Exceptions\ServiceException;
use App\Models\Integration;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * Trait for services that need to make authenticated API calls using integration tokens.
 */
trait UsesIntegrationTokens
{
    /**
     * Get an HTTP client authenticated with the integration's access token.
     */
    protected function getAuthenticatedClient(Integration $integration): PendingRequest
    {
        return Http::withToken((string) $integration->access_token);
    }

    /**
     * Handle an API error response by throwing a ServiceException.
     *
     * @throws ServiceException
     */
    protected function handleApiError(Response $response, string $context): never
    {
        $errorMessage = $response->json('error.message')
            ?? $response->json('error_description')
            ?? $response->body();

        throw new ServiceException(
            message: "{$context}: {$errorMessage}",
            code: $response->status()
        );
    }

    /**
     * Make an authenticated GET request.
     *
     * @param array<string, mixed> $query
     * @throws ServiceException
     */
    protected function authenticatedGet(
        Integration $integration,
        string $url,
        array $query = [],
        string $errorContext = 'API request failed'
    ): Response {
        /** @var Response $response */
        $response = $this->getAuthenticatedClient($integration)->get($url, $query);

        if ($response->failed()) {
            $this->handleApiError($response, $errorContext);
        }

        return $response;
    }

    /**
     * Make an authenticated POST request.
     *
     * @param array<string, mixed> $data
     * @throws ServiceException
     */
    protected function authenticatedPost(
        Integration $integration,
        string $url,
        array $data = [],
        string $errorContext = 'API request failed'
    ): Response {
        /** @var Response $response */
        $response = $this->getAuthenticatedClient($integration)->post($url, $data);

        if ($response->failed()) {
            $this->handleApiError($response, $errorContext);
        }

        return $response;
    }
}
