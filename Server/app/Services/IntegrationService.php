<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\ServiceException;
use App\Models\Integration;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Client\Response;

final class IntegrationService extends BaseService
{
    protected function getModelClass(): string
    {
        return Integration::class;
    }

    /**
     * Find or create an integration, accumulating scopes if it exists.
     *
     * @param array<string> $scopes
     */
    public function upsertFromOAuth(
        User $user,
        string $provider,
        string $providerId,
        string $accessToken,
        ?string $refreshToken,
        array $scopes,
        ?\DateTimeInterface $expiresAt = null
    ): Integration {
        $existing = Integration::query()->where('user_id', $user->id)
            ->where('provider', $provider)
            ->where('provider_id', $providerId)
            ->first();

        if ($existing) {
            // Accumulate scopes
            $mergedScopes = array_values(array_unique([
                ...($existing->scopes ?? []),
                ...$scopes,
            ]));

            $existing->update([
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken ?? $existing->refresh_token,
                'scopes' => $mergedScopes,
                'expires_at' => $expiresAt,
                'is_active' => true,
            ]);

            return $existing->fresh();
        }

        return Integration::create([
            'user_id' => $user->id,
            'provider' => $provider,
            'provider_id' => $providerId,
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'scopes' => $scopes,
            'expires_at' => $expiresAt,
            'is_active' => true,
        ]);
    }

    /**
     * Get all integrations for a user.
     *
     * @return Collection<int, Integration>
     */
    public function getForUser(User $user): Collection
    {
        return Integration::query()->where('user_id', $user->id)
            ->whereBoolean('is_active', true)
            ->get();
    }

    /**
     * Check if user has a specific provider connected.
     */
    public function hasProvider(User $user, string $provider): bool
    {
        return Integration::query()->where('user_id', $user->id)
            ->where('provider', $provider)
            ->whereBoolean('is_active', true)
            ->exists();
    }

    /**
     * Disconnect an integration (soft delete by deactivating).
     */
    public function disconnect(Integration $integration): bool
    {
        return $integration->update(['is_active' => false]);
    }

    /**
     * Get an active integration for a user by provider.
     */
    public function getActiveIntegration(int $userId, string $provider): ?Integration
    {
        return Integration::query()->where('user_id', $userId)
            ->where('provider', $provider)
            ->whereBoolean('is_active', true)
            ->first();
    }

    /**
     * Check if the integration token is expired.
     */
    public function isTokenExpired(Integration $integration): bool
    {
        if ($integration->expires_at === null) {
            return false;
        }

        // Consider expired if expiring in less than 5 minutes
        return $integration->expires_at->subMinutes(5)->isPast();
    }

    /**
     * Refresh the token safely using an Atomic Lock to prevent race conditions.
     *
     * @throws ServiceException
     */
    public function refreshTokenIfExpired(Integration $integration): Integration
    {
        if (!$this->isTokenExpired($integration)) {
            return $integration;
        }

        if ($integration->refresh_token === null) {
            throw new ServiceException(
                message: 'Cannot refresh token: no refresh token available',
                code: 400
            );
        }

        // Lock specifically for this integration ID.
        // If another job is already refreshing this specific user's token, we wait 10 seconds.
        $lock = Cache::lock("refresh_token_integration_{$integration->id}", 10);

        try {
            return $lock->block(5, function () use ($integration) {
                
                $freshIntegration = $integration->fresh();
                
                if (!$this->isTokenExpired($freshIntegration)) {
                    return $freshIntegration;
                }

                return $this->refreshToken($freshIntegration);
            });
        } catch (\Illuminate\Contracts\Cache\LockTimeoutException $e) {
            throw new ServiceException("Could not acquire lock to refresh token for integration {$integration->id}");
        }
    }

    /**
     * Perform the token refresh using the provider's OAuth endpoint.
     *
     * @throws ServiceException
     */
    private function refreshToken(Integration $integration): Integration
    {
        $provider = $integration->provider;

        $tokenUrl = match ($provider) {
            'google' => 'https://oauth2.googleapis.com/token',
            'github' => 'https://github.com/login/oauth/access_token',
            'slack' => 'https://slack.com/api/oauth.v2.access',
            default => throw new ServiceException(
                message: "Token refresh not supported for provider: {$provider}",
                code: 400
            ),
        };

        $clientId = config("services.{$provider}.client_id");
        $clientSecret = config("services.{$provider}.client_secret");

        if (!$clientId || !$clientSecret) {
            throw new ServiceException(
                message: "Missing OAuth credentials for provider: {$provider}",
                code: 500
            );
        }

        /** @var Response $response */
        $response = Http::asForm()->post($tokenUrl, [
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'refresh_token' => $integration->refresh_token,
            'grant_type' => 'refresh_token',
        ]);

        if ($response->failed()) {
            throw new ServiceException(
                message: 'Failed to refresh token: ' . ($response->json('error_description') ?? $response->body()),
                code: 400
            );
        }

        $data = $response->json();

        $integration->update([
            'access_token' => $data['access_token'],
            'refresh_token' => $data['refresh_token'] ?? $integration->refresh_token,
            'expires_at' => isset($data['expires_in'])
                ? now()->addSeconds((int) $data['expires_in'])
                : null,
        ]);

        return $integration->fresh();
    }
}
