<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\FocusSession;
use App\Services\ContextSnapshotService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ContextSnapshotController extends Controller
{
    public function __construct(
        protected ContextSnapshotService $service
    ) {}

    /**
     * Store a new context snapshot.
     */
    public function store(Request $request): JsonResponse
    {
        // 1. Validate
        $validated = $request->validate([
            'focus_session_id' => 'required|integer|exists:focus_sessions,id',
            'note' => 'nullable|string',
            'browser_state' => 'nullable', 
            'git_state' => 'nullable', 
            'voice_file' => 'nullable|file|mimes:audio/mpeg,mpga,mp3,wav,m4a|max:10240', 
        ]);

        $user = Auth::user();
        $session = FocusSession::findOrFail($validated['focus_session_id']);

        if ($session->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
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
        ];

        $snapshot = $this->service->createSnapshot(
            $session,
            $data,
            $request->file('voice_file')
        );

        return response()->json([
            'success' => true,
            'message' => 'Context saved successfully',
            'data' => [
                'id' => $snapshot->id,
                'created_at' => $snapshot->created_at->toIso8601String(),
            ]
        ], 201);
    }
}
