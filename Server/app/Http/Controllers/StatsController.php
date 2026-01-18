<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Stats\SetGoalRequest;
use App\Services\StatsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class StatsController extends BaseController
{
    public function __construct(
        private readonly StatsService $statsService
    ) {}

    /**
     * Get weekly aggregated stats.
     */
    public function weekly(Request $request): JsonResponse
    {
        $stats = $this->statsService->getWeeklyStats($request->user()->id);
        return $this->successResponse($stats);
    }

    /**
     * Get daily breakdown for the current week.
     */
    public function dailyBreakdown(Request $request): JsonResponse
    {
        $breakdown = $this->statsService->getDailyBreakdown($request->user()->id);
        return $this->successResponse($breakdown);
    }

    /**
     * Set the weekly flow time goal.
     */
    public function setGoal(SetGoalRequest $request): JsonResponse
    {
        $this->statsService->setWeeklyGoal(
            $request->user()->id,
            (int) $request->validated('target_minutes')
        );

        return $this->successResponse(null, 'Weekly goal updated successfully');
    }

    /**
     * Get productivity insights.
     */
    public function insights(Request $request): JsonResponse
    {
        $insights = $this->statsService->getProductivityInsights($request->user()->id);
        return $this->successResponse($insights);
    }
}
