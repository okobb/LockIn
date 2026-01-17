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
        private readonly \App\Services\FocusSessionService $focusSessionService,
        private readonly \App\Services\ContextSnapshotService $contextSnapshotService
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
            $result['session']->load('contextSnapshot');
            return $this->successResponse(
                [
                    'session' => $result['session'],
                    'status' => 'resumed'
                ],
                'Focus session resumed',
                200
            );
        }

        $result['session']->load('contextSnapshot');

        return $this->createdResponse([
            'session' => $result['session'],
            'status' => 'started',
            'restored_context' => $result['restored_context'],
        ], $result['restored_context'] ? 'Focus session started with restored context' : 'Focus session started');
    }

    /**
     * Get a focus session.
     */
    public function show(FocusSession $session): JsonResponse
    {
        if ($session->user_id !== request()->user()->id) {
            abort(403);
        }

        $session->load('contextSnapshot');

        return $this->successResponse(['session' => $session], 'Focus session retrieved');
    }
    public function addToChecklist(Request $request, FocusSession $session): JsonResponse
    {
        if ($session->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'text' => 'required|string|max:255',
        ]);

        $snapshot = $session->contextSnapshot;
        if (!$snapshot) {
             // Lazy creation of snapshot
             $snapshot = $this->contextSnapshotService->createSnapshot($session, []);
             $session->refresh();
        }

        $snapshot = $this->contextSnapshotService->addToChecklist($snapshot, $validated['text']);
        
        return $this->successResponse(['snapshot' => $snapshot], 'Checklist item added');
    }

    public function generateAIChecklist(FocusSession $session): JsonResponse
    {
        if ($session->user_id !== request()->user()->id) {
            abort(403);
        }

        $snapshot = $session->contextSnapshot;
        if (!$snapshot) {
             $snapshot = $this->contextSnapshotService->createSnapshot($session, []);
             $session->refresh();
        }

        $snapshot = $this->contextSnapshotService->generateAIChecklist($snapshot);

        return $this->successResponse(['snapshot' => $snapshot], 'AI checklist generated');
    }

    public function toggleChecklistItem(Request $request, FocusSession $session, int $index): JsonResponse
    {
        if ($session->user_id !== $request->user()->id) {
            abort(403);
        }

        $snapshot = $session->contextSnapshot;
        if (!$snapshot) {
             return $this->errorResponse('No active context snapshot found for this session.', 404);
        }

        try {
            $snapshot = $this->contextSnapshotService->toggleChecklistItem($snapshot, $index);
            return $this->successResponse(['snapshot' => $snapshot], 'Checklist item toggled');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }
}
