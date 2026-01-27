<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\AgendaService;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class DashboardController extends BaseController
{
    public function __construct(
        private readonly DashboardService $dashboardService,
        private readonly AgendaService $agendaService
    ) {}

    /**
     * Get dashboard statistics.
     */
    public function stats(Request $request): JsonResponse
    {
        $stats = $this->dashboardService->getStats($request->user()->id);

        return $this->successResponse($stats);
    }

    /**
     * Get priority tasks (high urgency, open status).
     */
    public function priorityTasks(Request $request): JsonResponse
    {
        $tasks = $this->dashboardService->getPriorityTasks($request->user()->id);

        return $this->successResponse($tasks);
    }

    /**
     * Get upcoming events for today.
     */
    public function upcoming(Request $request): JsonResponse
    {
        $events = $this->agendaService->getUnifiedAgenda($request->user()->id);

        return $this->successResponse($events);
    }

    /**
     * Get recent communications (unprocessed incoming messages).
     */
    public function communications(Request $request): JsonResponse
    {
        $messages = $this->dashboardService->getCommunications($request->user()->id);

        return $this->successResponse($messages);
    }
}
