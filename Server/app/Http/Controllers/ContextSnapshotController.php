<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\FocusSession;
use App\Services\ContextSnapshotService;
use App\Http\Requests\ContextSnapshot\StoreContextSnapshotRequest;
use Illuminate\Http\JsonResponse;

class ContextSnapshotController extends BaseController
{
    public function __construct(
        protected ContextSnapshotService $service
    ) {}

    /**
     * Store a new context snapshot.
     */
    public function store(StoreContextSnapshotRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();
        $session = FocusSession::findOrFail($validated['focus_session_id']);

        if ($session->user_id !== $user->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $browserState = $validated['browser_state'] ?? null;
        if (is_string($browserState)) {
            $browserState = json_decode($browserState, true);
        }

        $gitState = $validated['git_state'] ?? null;
        if (is_string($gitState)) {
            $gitState = json_decode($gitState, true);
        }

        $data = [
            'note' => $validated['note'] ?? null,
            'browser_state' => $browserState,
            'git_state' => $gitState,
            'checklist' => $validated['checklist'] ?? [],
        ];

        if ($session->contextSnapshot) {
            $snapshot = $this->service->updateSnapshot(
                $session->contextSnapshot,
                $data,
                $request->file('voice_file')
            );
        } else {
            $snapshot = $this->service->createSnapshot(
                $session,
                $data,
                $request->file('voice_file')
            );
        }

        return $this->createdResponse([
            'id' => $snapshot->id,
            'created_at' => $snapshot->created_at->toIso8601String(),
        ], 'Context saved successfully');
    }
}
