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
    /**
     * Get history of focus sessions with filtering.
     */
    public function getHistory(int $userId, array $filters): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = FocusSession::query()->where('user_id', $userId)
            ->where('status', '!=', 'active')
            ->with('contextSnapshot')
            ->orderBy('ended_at', 'desc');
            
        if (!empty($filters['search'])) {
            $query->where('title', 'ILIKE', "%{$filters['search']}%");
        }
        
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }
        
        return $query->paginate(20);
    }

    /**
     * Calculate stats for focus history.
     */
    public function getStats(int $userId): array
    {
        return [
            'total_contexts' => FocusSession::query()->where('user_id', $userId)
                ->where('status', '!=', 'active')
                ->count(),
                
            'this_week' => FocusSession::query()->where('user_id', $userId)
                ->where('status', '!=', 'active')
                ->where('ended_at', '>=', now()->startOfWeek())
                ->count(),
                
            'time_saved_minutes' => (int) FocusSession::query()->where('user_id', $userId)
                ->where('status', 'completed')
                ->sum('actual_duration_min'),
        ];
    }
}
