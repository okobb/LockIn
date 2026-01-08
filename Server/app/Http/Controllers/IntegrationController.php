<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\IntegrationResource;
use App\Models\Integration;
use App\Services\IntegrationService;
use App\Services\SocialiteService;
use Illuminate\Http\JsonResponse;
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

        $url = $this->socialiteService->getConnectRedirectUrl($provider, $service);

        return $this->successResponse([
            'redirect_url' => $url,
            'provider' => $provider,
            'service' => $service,
        ]);
    }

    /**
     * Handle the OAuth callback for connecting a service.
     */
    public function callback(Request $request, string $provider): JsonResponse
    {
        if (!$this->socialiteService->isProviderSupported($provider)) {
            return $this->errorResponse("Unsupported provider: {$provider}", 400);
        }

        // Get service from state or query parameter
        $service = $request->query('service', 'default');

        try {
            $socialUser = $this->socialiteService->handleCallback($provider);

            // Determine scopes based on service
            $scopes = is_string($service) && $this->socialiteService->isServiceValid($provider, $service)
                ? $this->socialiteService->getServiceScopes($provider, $service)
                : $this->socialiteService->getLoginScopes($provider);

            $integration = $this->integrationService->upsertFromOAuth(
                user: $request->user(),
                provider: $provider,
                providerId: $socialUser->getId(),
                accessToken: $socialUser->token,
                refreshToken: $socialUser->refreshToken ?? null,
                scopes: $scopes,
                expiresAt: isset($socialUser->expiresIn)
                    ? now()->addSeconds($socialUser->expiresIn)
                    : null
            );

            return $this->successResponse(
                new IntegrationResource($integration),
                'Service connected successfully'
            );
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to connect service: ' . $e->getMessage(), 400);
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
