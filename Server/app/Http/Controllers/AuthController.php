<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\AuthResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AuthController extends BaseController
{
    public function __construct(
        private readonly AuthService $authService
    ) {}

    public function login(LoginRequest $request): AuthResource
    {
        $payload = $this->authService->login($request->validated());

        return new AuthResource($payload);
    }

    public function register(RegisterRequest $request): AuthResource
    {
        $payload = $this->authService->register($request->validated());

        return new AuthResource($payload);
    }

    public function refresh(): AuthResource
    {
        $payload = $this->authService->refresh();

        return new AuthResource($payload);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    public function logout(): JsonResponse
    {
        $this->authService->logout();

        return $this->successResponse(message: 'Successfully logged out');
    }

    public function verifyEmail(int $id, string $hash): JsonResponse
    {
        $user = User::findOrFail($id);

        if (!$this->authService->verifyEmail($user, $hash)) {
            return $this->errorResponse('Invalid verification link', 400);
        }

        return $this->successResponse(message: 'Email verified successfully');
    }

    public function resendVerification(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $this->authService->resendVerification($user);

        return $this->successResponse(message: 'Verification email sent');
    }
}