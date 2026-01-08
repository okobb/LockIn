<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Integration;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

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
        $existing = Integration::where('user_id', $user->id)
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
        return Integration::where('user_id', $user->id)
            ->where('is_active', true)
            ->get();
    }

    /**
     * Check if user has a specific provider connected.
     */
    public function hasProvider(User $user, string $provider): bool
    {
        return Integration::where('user_id', $user->id)
            ->where('provider', $provider)
            ->where('is_active', true)
            ->exists();
    }

    /**
     * Disconnect an integration (soft delete by deactivating).
     */
    public function disconnect(Integration $integration): bool
    {
        return $integration->update(['is_active' => false]);
    }
}
