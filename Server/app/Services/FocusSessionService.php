<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\FocusSession;
use Illuminate\Support\Facades\DB;
use App\Traits\CachesData;
use Illuminate\Support\Facades\Cache;

/**
 * @extends BaseService<FocusSession>
 */
final class FocusSessionService extends BaseService
{
    use CachesData;

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
        return DB::transaction(function () use ($userId, $validated) {
            $activeSession = FocusSession::query()
                ->where('user_id', $userId)
                ->whereNull('ended_at')
                ->lockForUpdate()
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

            $prevSession = FocusSession::query()
                ->where('user_id', $userId)
                ->where(function ($query) use ($validated) {
                    $query->where('title', $validated['title'])
                        ->when(isset($validated['task_id']), function ($q) use ($validated) {
                            $q->orWhere('task_id', $validated['task_id']);
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
        });
    }
    /**
     * Get history of focus sessions with filtering.
     */
    public function getHistory(int $userId, array $filters): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = FocusSession::query()->where('user_id', $userId)
            ->where('status', '!=', 'active')
            ->with(['contextSnapshot.checklistItems', 'task'])
            ->orderBy('created_at', 'desc');
            
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
        return Cache::remember("focus:stats:{$userId}", now()->addMinutes(15), function () use ($userId) {
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
        });
    }

    /**
     * Mark session as completed and invalidate cache.
     */
    public function completeSession(FocusSession $session): FocusSession
    {
        $session->update([
            'status' => 'completed',
            'ended_at' => $session->ended_at ?? now(),
        ]);
        
        $this->clearUserStatsCache($session->user_id);
     
        return $session;
    }

    /**
     * Delete session by id and invalidate cache.
     */
    public function delete(int|string $id): bool
    {
        $session = $this->findOrFail($id);
        
        if ($session->contextSnapshot) {
            $session->contextSnapshot->delete();
        }
        
        $session->delete();
        $this->clearUserStatsCache($session->user_id);
        return true;
    }

    /**
     * Clear the stats cache for a user.
     */
    public function clearUserStatsCache(int $userId): void
    {
        Cache::forget("focus:stats:{$userId}");
    }
}
