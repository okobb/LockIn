<?php

declare(strict_types=1);

namespace App\Services;

use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\AbstractProvider;
use Laravel\Socialite\Two\User as SocialiteUser;
use App\Models\User;
use App\Services\AuthService;
use App\Services\IntegrationService;
use Exception;

require_once __DIR__ . '/../consts.php';

final class SocialiteService
{
    public function __construct(
        private readonly AuthService $authService,
        private readonly IntegrationService $integrationService
    ) {}

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
     * Handle the full OAuth completion flow: users, integrations, and redirects.
     */
    public function handleOAuthComplete(string $provider, ?string $state): string
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

        if (!$this->isProviderSupported($provider)) {
            return $frontendUrl . '/login?error=' . urlencode("Unsupported provider: {$provider}");
        }

        ['service' => $service, 'user_id' => $userId] = $this->parseState($state);

        try {
            $socialUser = $this->handleCallback($provider);

            $scopes = $service 
                ? $this->getServiceScopes($provider, $service)
                : $this->getLoginScopes($provider);

            if ($userId && $service) {
                return $this->handleIntegrationConnect($userId, $provider, $socialUser, $scopes, $frontendUrl);
            }

            return $this->handleLoginOrRegister($provider, $socialUser, $scopes, $frontendUrl);

        } catch (Exception $e) {
            $redirectTarget = $service ? '/settings' : '/login';
            return $frontendUrl . $redirectTarget . '?error=' . urlencode('OAuth validation failed: ' . $e->getMessage());
        }
    }

    private function parseState(?string $state): array
    {
        if (!$state) {
            return ['service' => null, 'user_id' => null];
        }
        $stateParts = [];
        parse_str($state, $stateParts);
        return [
            'service' => $stateParts['service'] ?? null,
            'user_id' => isset($stateParts['user_id']) ? (int) $stateParts['user_id'] : null,
        ];
    }

    private function handleIntegrationConnect(int $userId, string $provider, SocialiteUser $socialUser, array $scopes, string $frontendUrl): string
    {
        $user = User::find($userId);
        if (!$user) {
            return "{$frontendUrl}/settings?error=" . urlencode('User not found');
        }
        
        $this->integrationService->upsertFromOAuth(
            user: $user,
            provider: $provider,
            providerId: (string) $socialUser->getId(),
            accessToken: $socialUser->token,
            refreshToken: $socialUser->refreshToken ?? null,
            scopes: $scopes,
            expiresAt: isset($socialUser->expiresIn)
                ? now()->addSeconds($socialUser->expiresIn)
                : null
        );

        return "{$frontendUrl}/settings?connected=true";
    }

    private function handleLoginOrRegister(string $provider, SocialiteUser $socialUser, array $scopes, string $frontendUrl): string
    {
        $authPayload = $this->authService->loginOrRegisterFromOAuth(
            email: $socialUser->getEmail(),
            name: $socialUser->getName() ?? $socialUser->getNickname() ?? 'User',
            avatar: $socialUser->getAvatar()
        );

        $existingIntegration = $this->integrationService->getActiveIntegration(
            $authPayload['user']->id,
            $provider
        );
        
        $shouldUpdateTokens = true;
        if ($existingIntegration) {
            $existingScopes = $existingIntegration->scopes ?? [];
            if (count($existingScopes) > count($scopes)) {
                $shouldUpdateTokens = false;
            }
        }

        if ($shouldUpdateTokens) {
            $this->integrationService->upsertFromOAuth(
                user: $authPayload['user'],
                provider: $provider,
                providerId: (string) $socialUser->getId(),
                accessToken: $socialUser->token,
                refreshToken: $socialUser->refreshToken ?? null,
                scopes: $scopes,
                expiresAt: isset($socialUser->expiresIn)
                    ? now()->addSeconds($socialUser->expiresIn)
                    : null
            );
        }

        $token = $authPayload['token'];
        $userArray = [
            'id' => $authPayload['user']->id,
            'name' => $authPayload['user']->name,
            'email' => $authPayload['user']->email,
        ];
        $userJson = urlencode(json_encode($userArray));

        return "{$frontendUrl}/auth/callback?token={$token}&user={$userJson}";
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
            // Gmail and Calendar
            [PROVIDER_GOOGLE, 'workspace'] => [
                'openid', 'email', 'profile',
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/calendar.readonly',
            ],
            // Legacy individual services
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
