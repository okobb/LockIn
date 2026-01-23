<?php

declare(strict_types=1);

namespace App\Traits;

use Illuminate\Support\Facades\Cache;

trait CachesData
{
    /**
     * Clear all stats-related caches for a user.
     */
    protected function clearUserStatsCache(int $userId): void
    {
        Cache::forget("stats:weekly:{$userId}");
        Cache::forget("stats:daily:{$userId}");
        Cache::forget("stats:streak:{$userId}");
        Cache::forget("focus:stats:{$userId}");
        Cache::forget("dashboard:stats:{$userId}");
    }

    /**
     * Clear dashboard-specific caches for a user.
     */
    protected function clearUserDashboardCache(int $userId): void
    {
        Cache::forget("dashboard:stats:{$userId}");
        Cache::forget("dashboard:events:{$userId}");
        Cache::forget("dashboard:communications:{$userId}");
    }

    /**
     * Clear resource list caches for a user.
     */
    protected function clearUserResourceCache(int $userId): void
    {
        // Cache::tags(["resources:{$userId}"])->flush();
    }
}
