<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to authenticate n8n API requests via secret header.
 */
final class N8nAuthMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $secret = $request->header('X-n8n-Secret');
        $expectedSecret = config('services.n8n.api_secret');

        if (empty($expectedSecret)) {
            return new JsonResponse(
                ['error' => 'n8n API secret not configured'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }

        if ($secret !== $expectedSecret) {
            return new JsonResponse(
                ['error' => 'Invalid n8n API secret'],
                Response::HTTP_UNAUTHORIZED
            );
        }

        return $next($request);
    }
}
