<?php

declare(strict_types=1);

namespace App\Services;

use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\AbstractProvider;
use Laravel\Socialite\Two\User as SocialiteUser;

final class SocialiteService
{
    /**
     * Supported providers.
     */
    public const PROVIDER_GOOGLE = 'google';
    public const PROVIDER_GITHUB = 'github';
    public const PROVIDER_SLACK = 'slack';

    /**
     * Service types for additional scopes.
     */
    public const SERVICE_GMAIL = 'gmail';
    public const SERVICE_CALENDAR = 'calendar';
    public const SERVICE_REPOS = 'repos';
    public const SERVICE_NOTIFICATIONS = 'notifications';

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
            self::PROVIDER_GOOGLE => ['openid', 'email', 'profile'],
            self::PROVIDER_GITHUB => ['read:user', 'user:email'],
            self::PROVIDER_SLACK => ['identity.basic', 'identity.email'],
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
            [self::PROVIDER_GOOGLE, self::SERVICE_GMAIL] => [
                'openid', 'email', 'profile',
                'https://www.googleapis.com/auth/gmail.readonly',
            ],
            [self::PROVIDER_GOOGLE, self::SERVICE_CALENDAR] => [
                'openid', 'email', 'profile',
                'https://www.googleapis.com/auth/calendar.readonly',
            ],
            [self::PROVIDER_GITHUB, self::SERVICE_REPOS] => [
                'read:user', 'user:email', 'repo',
            ],
            [self::PROVIDER_SLACK, self::SERVICE_NOTIFICATIONS] => [
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
            self::PROVIDER_GOOGLE,
            self::PROVIDER_GITHUB,
            self::PROVIDER_SLACK,
        ], true);
    }

    /**
     * Check if service is valid for provider.
     */
    public function isServiceValid(string $provider, string $service): bool
    {
        return match ($provider) {
            self::PROVIDER_GOOGLE => in_array($service, [self::SERVICE_GMAIL, self::SERVICE_CALENDAR], true),
            self::PROVIDER_GITHUB => $service === self::SERVICE_REPOS,
            self::PROVIDER_SLACK => $service === self::SERVICE_NOTIFICATIONS,
            default => false,
        };
    }
}
