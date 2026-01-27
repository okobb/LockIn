<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\ReadLater\StoreReadLaterRequest;
use App\Services\LiquidSchedulerService;
use App\Services\ReadLaterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ReadLaterController extends BaseController
{
    public function __construct(
        private readonly ReadLaterService $readLaterService,
        private readonly LiquidSchedulerService $liquidSchedulerService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $queue = $this->readLaterService->getQueue($request->user()->id);
        return $this->successResponse($queue);
    }

    public function store(StoreReadLaterRequest $request): JsonResponse
    {
        $item = $this->readLaterService->addToQueue(
            $request->user()->id,
            $request->validated()
        );

        return $this->successResponse($item, 'Added to read later queue');
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->readLaterService->removeFromQueue($request->user()->id, $id);
        return $this->successResponse(null, 'Removed from queue');
    }

    public function start(Request $request, int $id): JsonResponse
    {
        $item = $this->readLaterService->markStarted($request->user()->id, $id);
        return $this->successResponse($item);
    }

    public function complete(Request $request, int $id): JsonResponse
    {
        $item = $this->readLaterService->markCompleted($request->user()->id, $id);
        return $this->successResponse($item, 'Marked as completed');
    }

    public function suggestions(Request $request): JsonResponse
    {
        $suggestions = $this->liquidSchedulerService->getTodaySuggestions($request->user()->id);
        return $this->successResponse($suggestions);
    }
}
