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
        $redirectUrl = $this->socialiteService->handleOAuthComplete(
            $provider,
            $request->input('state')
        );

        return redirect($redirectUrl);
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
