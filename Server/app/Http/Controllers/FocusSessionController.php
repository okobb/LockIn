<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\FocusSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

use App\Http\Requests\FocusSession\StoreFocusSessionRequest;
use App\Services\ContextSnapshotService;
use App\Services\FocusSessionService;

final class FocusSessionController extends BaseController
{
    public function __construct(
        private readonly FocusSessionService $focusSessionService,
        private readonly ContextSnapshotService $contextSnapshotService
    ) {}

    /**
     * List all focus sessions for history (excludes active sessions).
     */
    public function index(Request $request): JsonResponse
    {
        $sessions = $this->focusSessionService->getHistory(
            $request->user()->id,
            [
                'search' => $request->input('search'),
                'status' => $request->input('status'),
            ]
        );

        $stats = $this->focusSessionService->getStats($request->user()->id);

        return $this->successResponse([
            'sessions' => $sessions,
            'stats' => $stats,
        ], 'Focus sessions retrieved');
    }

    /**
     * Mark a focus session as completed.
     */
    public function complete(FocusSession $session): JsonResponse
    {
        if ($session->user_id !== request()->user()->id) {
            return $this->forbiddenResponse();
        }

        $session->update([
            'status' => 'completed',
            'ended_at' => $session->ended_at ?? now(),
        ]);

        return $this->successResponse(['session' => $session], 'Session marked as completed');
    }

    /**
     * Delete a focus session and its associated snapshot.
     */
    public function destroy(FocusSession $session): JsonResponse
    {
        if ($session->user_id !== request()->user()->id) {
            return $this->forbiddenResponse();
        }

        // Delete associated context snapshot if exists
        if ($session->contextSnapshot) {
            $session->contextSnapshot->delete();
        }

        $session->delete();

        return $this->successResponse(null, 'Session deleted successfully');
    }

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

    public function addResource(Request $request, FocusSession $session): JsonResponse
    {
        if ($session->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'url' => 'required|url',
        ]);

        $snapshot = $session->contextSnapshot;
        if (!$snapshot) {
            $snapshot = $this->contextSnapshotService->createSnapshot($session, []);
            $session->refresh();
        }

        $snapshot = $this->contextSnapshotService->addBrowserTab($snapshot, $validated['title'], $validated['url']);

        return $this->successResponse(['snapshot' => $snapshot], 'Resource added to session context');
    }
}
