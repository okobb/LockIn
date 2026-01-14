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
}
