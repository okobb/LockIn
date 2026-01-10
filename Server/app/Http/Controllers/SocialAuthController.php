<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\AuthResource;
use App\Services\AuthService;
use App\Services\IntegrationService;
use App\Services\SocialiteService;
use Illuminate\Http\JsonResponse;

final class SocialAuthController extends BaseController
{
    public function __construct(
        private readonly SocialiteService $socialiteService,
        private readonly AuthService $authService,
        private readonly IntegrationService $integrationService
    ) {}

    /**
     * Get the OAuth redirect URL for login.
     */
    public function redirect(string $provider): JsonResponse
    {
        if (!$this->socialiteService->isProviderSupported($provider)) {
            return $this->errorResponse("Unsupported provider: {$provider}", 400);
        }

        $url = $this->socialiteService->getLoginRedirectUrl($provider);

        return $this->successResponse(['redirect_url' => $url]);
    }

    /**
     * Handle the OAuth callback for login.
     */
    public function callback(string $provider): JsonResponse
    {
        if (!$this->socialiteService->isProviderSupported($provider)) {
            return $this->errorResponse("Unsupported provider: {$provider}", 400);
        }

        try {
            /** @var \Laravel\Socialite\Two\User $socialUser */
            $socialUser = $this->socialiteService->handleCallback($provider);

            // Login or register the user
            $authPayload = $this->authService->loginOrRegisterFromOAuth(
                email: $socialUser->getEmail(),
                name: $socialUser->getName() ?? $socialUser->getNickname() ?? 'User',
                avatar: $socialUser->getAvatar()
            );

            // Store/update the integration with identity scopes
            $this->integrationService->upsertFromOAuth(
                user: $authPayload['user'],
                provider: $provider,
                providerId: $socialUser->getId(),
                accessToken: $socialUser->token,
                refreshToken: $socialUser->refreshToken ?? null,
                scopes: $this->socialiteService->getLoginScopes($provider),
                expiresAt: isset($socialUser->expiresIn)
                    ? now()->addSeconds($socialUser->expiresIn)
                    : null
            );

            return (new AuthResource($authPayload))
                ->additional(['is_new_user' => $authPayload['is_new']])
                ->response();
        } catch (\Exception $e) {
            return $this->errorResponse('OAuth authentication failed: ' . $e->getMessage(), 401);
        }
    }
}
