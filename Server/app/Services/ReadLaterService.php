<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ReadLaterQueue;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;

final class ReadLaterService
{
    public function getQueue(int $userId): Collection
    {
        return ReadLaterQueue::query()
            ->with('resource')
            ->where('user_id', $userId)
            ->where('is_completed', false)
            ->orderBy('scheduled_for', 'asc')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function addToQueue(int $userId, array $data): ReadLaterQueue
    {
        return ReadLaterQueue::create([
            'user_id' => $userId,
            'resource_id' => $data['resource_id'],
            'estimated_minutes' => $data['estimated_minutes'] ?? null,
            'scheduled_for' => $data['scheduled_for'] ?? null,
            'gap_type' => $data['gap_type'] ?? null,
        ]);
    }

    public function removeFromQueue(int $userId, int $queueId): bool
    {
        $item = ReadLaterQueue::where('user_id', $userId)->findOrFail($queueId);
        return $item->delete();
    }

    public function markStarted(int $userId, int $queueId): ReadLaterQueue
    {
        $item = ReadLaterQueue::where('user_id', $userId)->findOrFail($queueId);
        
        $item->update([
            'started_at' => now(),
        ]);

        return $item;
    }

    public function markCompleted(int $userId, int $queueId): ReadLaterQueue
    {
        $item = ReadLaterQueue::where('user_id', $userId)->findOrFail($queueId);
        
        $item->update([
            'is_completed' => true,
            'completed_at' => now(),
        ]);

        return $item;
    }
}
