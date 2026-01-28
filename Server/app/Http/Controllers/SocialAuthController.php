<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\SocialiteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class SocialAuthController extends BaseController
{
    public function __construct(
        private readonly SocialiteService $socialiteService
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
    public function callback(Request $request, string $provider): RedirectResponse
    {
        $redirectUrl = $this->socialiteService->handleOAuthComplete(
            $provider,
            $request->input('state')
        );

        return redirect($redirectUrl);
    }
}
