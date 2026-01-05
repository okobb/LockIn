<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\User\IndexUserRequest;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdatePasswordRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;

/**
 * Controller handling User-related HTTP requests.
 */
final class UserController extends BaseController
{
    public function __construct(
        private readonly UserService $userService
    ) {}

    public function index(IndexUserRequest $request): JsonResponse
    {
        $validated = $request->validated();
        
        $perPage = (int) ($validated['per_page'] ?? 15);
        $filters = array_diff_key($validated, ['per_page' => true]);

        $paginator = $this->userService->paginate($perPage, $filters);

        return $this->successResponse(
            data: UserResource::collection($paginator),
            message: 'Users retrieved successfully'
        );
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->userService->create($request->validated());

        return $this->createdResponse(
            data: new UserResource($user),
            message: 'User created successfully'
        );
    }

    public function show(int $id): JsonResponse
    {
        $user = $this->userService->findOrFail($id);

        return $this->successResponse(
            data: new UserResource($user),
            message: 'User retrieved successfully'
        );
    }

    public function update(UpdateUserRequest $request, int $id): JsonResponse
    {
        $user = $this->userService->update($id, $request->validated());

        return $this->successResponse(
            data: new UserResource($user),
            message: 'User updated successfully'
        );
    }

    public function destroy(int $id): JsonResponse
    {
        $this->userService->delete($id);

        return $this->noContentResponse();
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $this->userService->updatePassword(
            id: $request->user()->id,
            currentPassword: $request->validated('current_password'),
            newPassword: $request->validated('new_password')
        );

        return $this->successResponse(
            message: 'Password updated successfully'
        );
    }
}