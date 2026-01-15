<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\FocusSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

use App\Http\Requests\FocusSession\StoreFocusSessionRequest;

final class FocusSessionController extends BaseController
{
    public function __construct(
        private readonly \App\Services\FocusSessionService $focusSessionService
    ) {}

    /**
     * Store a new focus session.
     */
    public function store(StoreFocusSessionRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        $result = $this->focusSessionService->handleSessionStart($user->id, $validated);

        if ($result['status'] === 'resumed') {
            return $this->successResponse(
                [
                    'session' => $result['session'],
                    'status' => 'resumed'
                ],
                'Focus session resumed',
                200
            );
        }

        return $this->createdResponse([
            'session' => $result['session'],
            'status' => 'started',
            'restored_context' => $result['restored_context'],
        ], $result['restored_context'] ? 'Focus session started with restored context' : 'Focus session started');
    }
}
