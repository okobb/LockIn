<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\FocusSession;

/**
 * @extends BaseService<FocusSession>
 */
final class FocusSessionService extends BaseService
{
    protected function getModelClass(): string
    {
        return FocusSession::class;
    }

    /**
     * Start a new focus session.
     */
    public function startSession(int $userId, string $title, ?int $taskId = null, int $durationMin = 25, ?int $prevContextId = null): FocusSession
    {
        return $this->create([
            'user_id' => $userId,
            'title' => $title,
            'task_id' => $taskId,
            'status' => 'active',
            'planned_duration_min' => $durationMin,
            'started_at' => now(),
            'context_snapshot_id' => $prevContextId,
        ]);
    }

    /**
     * Handle the start of a focus session, including resumption and context restoration.
     *
     * @return array{session: FocusSession, status: string, restored_context: bool}
     */
    public function handleSessionStart(int $userId, array $validated): array
    {
        $activeSession = FocusSession::where('user_id', '=', $userId, 'and')
            ->whereNull('ended_at')
            ->first();

        if ($activeSession) {
            $matchesTitle = $activeSession->title === $validated['title'];
            $matchesTask = isset($validated['task_id']) && $activeSession->task_id === $validated['task_id'];

            if ($matchesTitle || $matchesTask) {
                return [
                    'session' => $activeSession,
                    'status' => 'resumed',
                    'restored_context' => false,
                ];
            }

            $activeSession->update([
                'ended_at' => now(),
                'status' => 'abandoned',
            ]);
        }

        $prevSession = FocusSession::where('user_id', '=', $userId, 'and')
            ->where(function ($query) use ($validated) {
                $query->where('title', '=', $validated['title'], 'and')
                    ->when(isset($validated['task_id']), function ($q) use ($validated) {
                        $q->orWhere('task_id', '=', $validated['task_id']);
                    });
            })
            ->whereNotNull('context_snapshot_id')
            ->orderBy('ended_at', 'desc')
            ->first(['*']);

        $session = $this->startSession(
            $userId,
            $validated['title'],
            $validated['task_id'] ?? null,
            $validated['duration_min'] ?? 25,
            $prevSession?->context_snapshot_id
        );

        return [
            'session' => $session,
            'status' => 'started',
            'restored_context' => (bool) $prevSession,
        ];
    }
}
