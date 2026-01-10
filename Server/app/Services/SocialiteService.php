<?php

declare(strict_types=1);

namespace App\Services;

use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\AbstractProvider;
use Laravel\Socialite\Two\User as SocialiteUser;

require_once __DIR__ . '/../consts.php';

final class SocialiteService
{
    /**
     * Get the OAuth redirect URL for login (identity scopes only).
     */
    public function getLoginRedirectUrl(string $provider): string
    {
        $scopes = $this->getLoginScopes($provider);

        /** @var AbstractProvider $driver */
        $driver = Socialite::driver($provider);

        return $driver
            ->scopes($scopes)
            ->stateless()
            ->redirect()
            ->getTargetUrl();
    }

    /**
     * Get the OAuth redirect URL for connecting a service (resource scopes).
     */
    public function getConnectRedirectUrl(string $provider, string $service): string
    {
        $scopes = $this->getServiceScopes($provider, $service);

        /** @var AbstractProvider $driver */
        $driver = Socialite::driver($provider);

        return $driver
            ->scopes($scopes)
            ->stateless()
            ->redirect()
            ->getTargetUrl();
    }

    /**
     * Handle OAuth callback and return the user data.
     */
    public function handleCallback(string $provider): SocialiteUser
    {
        /** @var AbstractProvider $driver */
        $driver = Socialite::driver($provider);

        return $driver->stateless()->user();
    }

    /**
     * Get login scopes (identity only) for a provider.
     *
     * @return array<string>
     */
    public function getLoginScopes(string $provider): array
    {
        return match ($provider) {
            PROVIDER_GOOGLE => ['openid', 'email', 'profile'],
            PROVIDER_GITHUB => ['read:user', 'user:email'],
            PROVIDER_SLACK => ['identity.basic', 'identity.email'],
            default => [],
        };
    }

    /**
     * Get service-specific scopes for resource authorization.
     *
     * @return array<string>
     */
    public function getServiceScopes(string $provider, string $service): array
    {
        return match ([$provider, $service]) {
            [PROVIDER_GOOGLE, SERVICE_GMAIL] => [
                'openid', 'email', 'profile',
                'https://www.googleapis.com/auth/gmail.readonly',
            ],
            [PROVIDER_GOOGLE, SERVICE_CALENDAR] => [
                'openid', 'email', 'profile',
                'https://www.googleapis.com/auth/calendar.readonly',
            ],
            [PROVIDER_GITHUB, SERVICE_REPOS] => [
                'read:user', 'user:email', 'repo',
            ],
            [PROVIDER_SLACK, SERVICE_NOTIFICATIONS] => [
                'identity.basic', 'identity.email',
                'chat:write', 'channels:read',
            ],
            default => $this->getLoginScopes($provider),
        };
    }

    /**
     * Check if provider is supported.
     */
    public function isProviderSupported(string $provider): bool
    {
        return in_array($provider, [
            PROVIDER_GOOGLE,
            PROVIDER_GITHUB,
            PROVIDER_SLACK,
        ], true);
    }

    /**
     * Check if service is valid for provider.
     */
    public function isServiceValid(string $provider, string $service): bool
    {
        return match ($provider) {
            PROVIDER_GOOGLE => in_array($service, [SERVICE_GMAIL, SERVICE_CALENDAR], true),
            PROVIDER_GITHUB => $service === SERVICE_REPOS,
            PROVIDER_SLACK => $service === SERVICE_NOTIFICATIONS,
            default => false,
        };
    }
}
