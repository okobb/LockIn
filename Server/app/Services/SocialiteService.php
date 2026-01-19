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

        $parameters = [];
        if ($provider === PROVIDER_GOOGLE) {
            $parameters = ['access_type' => 'offline', 'prompt' => 'consent'];
        }

        return $driver
            ->scopes($scopes)
            ->with($parameters)
            ->stateless()
            ->redirect()
            ->getTargetUrl();
    }

    /**
     * Get the OAuth redirect URL for connecting a service (resource scopes).
     */
    public function getConnectRedirectUrl(string $provider, string $service, int $userId): string
    {
        $scopes = $this->getServiceScopes($provider, $service);

        /** @var AbstractProvider $driver */
        $driver = Socialite::driver($provider);

        $parameters = ['state' => "service={$service}&user_id={$userId}"];
        if ($provider === PROVIDER_GOOGLE) {
            $parameters['access_type'] = 'offline';
            $parameters['prompt'] = 'consent';
        }

        if ($provider === PROVIDER_SLACK) {
            return $driver
                ->setScopes($scopes)
                ->with($parameters)
                ->stateless()
                ->redirect()
                ->getTargetUrl();
        }

        return $driver
            ->scopes($scopes)
            ->with($parameters)
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
            // Consolidated Google Workspace - includes both Gmail and Calendar
            [PROVIDER_GOOGLE, 'workspace'] => [
                'openid', 'email', 'profile',
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/calendar.readonly',
            ],
            // Legacy individual services (still supported for backwards compatibility)
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
                'channels:read', 'channels:history',   // Public channels
                'groups:read', 'groups:history',       // Private channels
                'im:read', 'im:history',               // Direct messages
                'mpim:read', 'mpim:history',           // Group DMs
                'users:read',                          // Look up user names
                'chat:write',
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
            PROVIDER_GOOGLE => in_array($service, [SERVICE_GMAIL, SERVICE_CALENDAR, 'workspace'], true),
            PROVIDER_GITHUB => $service === SERVICE_REPOS,
            PROVIDER_SLACK => $service === SERVICE_NOTIFICATIONS,
            default => false,
        };
    }
}
