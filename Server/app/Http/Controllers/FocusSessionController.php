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

        // 1. Check for Active Session
        $activeSession = FocusSession::where('user_id', '=', $user->id, 'and')
            ->whereNull('ended_at')
            ->first();

        if ($activeSession) {
            // 2. Scenario A (Resume)
            $matchesTitle = $activeSession->title === $validated['title'];
            $matchesTask = isset($validated['task_id']) && $activeSession->task_id === $validated['task_id'];

            if ($matchesTitle || $matchesTask) {
            if ($matchesTitle || $matchesTask) {
                return $this->successResponse(
                    [
                        'session' => $activeSession,
                        'status' => 'resumed'
                    ],
                    'Focus session resumed',
                    200
                );
            }
            }

            // 3. Scenario B (Context Switch)
            // Close the old session as 'abandoned'
            $activeSession->update([
                'ended_at' => now(),
                'status' => 'abandoned',
            ]);
        }

        // 4. Scenario C (Fresh Start) / Switch
        $prevSession = FocusSession::where('user_id', '=', $user->id, 'and')
            ->where(function ($query) use ($validated) {
                $query->where('title', '=', $validated['title'], 'and')
                    ->when(isset($validated['task_id']), function ($q) use ($validated) {
                        $q->orWhere('task_id', '=', $validated['task_id']);
                    });
            })
            ->whereNotNull('context_snapshot_id')
            ->orderBy('ended_at', 'desc')
            ->first(['*']);

        $session = $this->focusSessionService->startSession(
            $user->id,
            $validated['title'],
            $validated['task_id'] ?? null,
            $validated['duration_min'] ?? 25,
            $prevSession?->context_snapshot_id // Pass the context ID if found
        );

        return $this->createdResponse([
            'session' => $session,
            'status' => 'started',
            'restored_context' => (bool) $prevSession,
        ], $prevSession ? 'Focus session started with restored context' : 'Focus session started');
    }
}
