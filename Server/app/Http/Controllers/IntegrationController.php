<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\IntegrationResource;
use App\Models\Integration;
use App\Models\User;
use App\Services\IntegrationService;
use App\Services\SocialiteService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class IntegrationController extends BaseController
{
    public function __construct(
        private readonly SocialiteService $socialiteService,
        private readonly IntegrationService $integrationService
    ) {}

    /**
     * List all connected integrations for the authenticated user.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $integrations = $this->integrationService->getForUser($request->user());

        return IntegrationResource::collection($integrations);
    }

    /**
     * Get the OAuth redirect URL for connecting a service.
     */
    public function redirect(Request $request, string $provider, string $service): JsonResponse
    {
        if (!$this->socialiteService->isProviderSupported($provider)) {
            return $this->errorResponse("Unsupported provider: {$provider}", 400);
        }

        if (!$this->socialiteService->isServiceValid($provider, $service)) {
            return $this->errorResponse("Invalid service '{$service}' for provider '{$provider}'", 400);
        }

        $url = $this->socialiteService->getConnectRedirectUrl($provider, $service, $request->user()->id);

        return $this->successResponse([
            'redirect_url' => $url,
            'provider' => $provider,
            'service' => $service,
        ]);
    }

    /**
     * Handle the OAuth callback for connecting a service.
     */
    public function callback(Request $request, string $provider): RedirectResponse
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

        if (!$this->socialiteService->isProviderSupported($provider)) {
            return redirect("{$frontendUrl}/settings?error=" . urlencode("Unsupported provider: {$provider}"));
        }

        // Parse state to get service and user_id
        $service = 'default';
        $userId = null;
        if ($request->has('state')) {
            parse_str($request->input('state'), $stateParams);
            $service = $stateParams['service'] ?? 'default';
            $userId = isset($stateParams['user_id']) ? (int) $stateParams['user_id'] : null;
        }

        if (!$userId) {
            return redirect("{$frontendUrl}/settings?error=" . urlencode('Invalid OAuth state: missing user identifier'));
        }

        $user = User::find($userId);
        if (!$user) {
            return redirect("{$frontendUrl}/settings?error=" . urlencode('User not found'));
        }

        try {
            $socialUser = $this->socialiteService->handleCallback($provider);

            // Determine scopes based on service
            $scopes = is_string($service) && $this->socialiteService->isServiceValid($provider, $service)
                ? $this->socialiteService->getServiceScopes($provider, $service)
                : $this->socialiteService->getLoginScopes($provider);

            $integration = $this->integrationService->upsertFromOAuth(
                user: $user,
                provider: $provider,
                providerId: $socialUser->getId(),
                accessToken: $socialUser->token,
                refreshToken: $socialUser->refreshToken ?? null,
                scopes: $scopes,
                expiresAt: isset($socialUser->expiresIn)
                    ? now()->addSeconds($socialUser->expiresIn)
                    : null
            );

            return redirect("{$frontendUrl}/settings?connected=true");
        } catch (Exception $e) {
            return redirect("{$frontendUrl}/settings?error=" . urlencode('Failed to connect service: ' . $e->getMessage()));
        }
    }

    /**
     * Disconnect an integration.
     */
    public function destroy(Request $request, Integration $integration): JsonResponse
    {
        // Ensure user owns this integration
        if ($integration->user_id !== $request->user()->id) {
            return $this->forbiddenResponse('You do not own this integration');
        }

        $this->integrationService->disconnect($integration);

        return $this->successResponse(message: 'Integration disconnected successfully');
    }
}
