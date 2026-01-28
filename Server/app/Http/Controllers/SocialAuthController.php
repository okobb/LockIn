<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\AuthResource;
use App\Services\AuthService;
use App\Services\IntegrationService;
use App\Services\SocialiteService;
use Exception;
use Illuminate\Http\JsonResponse;
use Laravel\Socialite\Two\User;

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
    public function callback(\Illuminate\Http\Request $request, string $provider): \Illuminate\Http\RedirectResponse
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

        if (!$this->socialiteService->isProviderSupported($provider)) {
            return redirect($frontendUrl . '/login?error=' . urlencode("Unsupported provider: {$provider}"));
        }

        // Check for service and user_id in state
        $service = null;
        $userId = null;
        if ($request->has('state')) {
            $stateParts = [];
            parse_str($request->input('state'), $stateParts);
            if (isset($stateParts['service'])) {
                $service = $stateParts['service'];
            }
            if (isset($stateParts['user_id'])) {
                $userId = (int) $stateParts['user_id'];
            }
        }

        try {
            /** @var User $socialUser */
            $socialUser = $this->socialiteService->handleCallback($provider);

            $scopes = $service 
                ? $this->socialiteService->getServiceScopes($provider, $service)
                : $this->socialiteService->getLoginScopes($provider);

            // If this is an integration connect (user_id present), use that user
            // Otherwise, login/register the user from OAuth email
            if ($userId && $service) {
                // Integration connect flow - user is already logged in
                $user = \App\Models\User::find($userId);
                if (!$user) {
                    return redirect("{$frontendUrl}/settings?error=" . urlencode('User not found'));
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

                return redirect("{$frontendUrl}/settings?connected=true");
            }

            $authPayload = $this->authService->loginOrRegisterFromOAuth(
                email: $socialUser->getEmail(),
                name: $socialUser->getName() ?? $socialUser->getNickname() ?? 'User',
                avatar: $socialUser->getAvatar()
            );

            // Check if user already has an integration with broader scopes
            // If so, don't overwrite their tokens (which would lose permissions)
            $existingIntegration = $this->integrationService->getActiveIntegration(
                $authPayload['user']->id,
                $provider
            );
            
            $shouldUpdateTokens = true;
            if ($existingIntegration) {
                $existingScopes = $existingIntegration->scopes ?? [];
                // If existing integration has more scopes than login scopes,
                // preserve the existing tokens to maintain those permissions
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

            return redirect("{$frontendUrl}/auth/callback?token={$token}&user={$userJson}");
        } catch (Exception $e) {
            $redirectTarget = $service ? '/settings' : '/login';
            return redirect($frontendUrl . $redirectTarget . '?error=' . urlencode('OAuth validation failed: ' . $e->getMessage()));
        }
    }
}
