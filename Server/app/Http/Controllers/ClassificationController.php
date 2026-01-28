<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\ClassifyMessageRequest;
use App\Services\ClassificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassificationController extends BaseController
{
    public function __construct(
        private readonly ClassificationService $classificationService
    ) {}

    /**
     * Classify a message as Important or Noise.
     */
    public function classify(ClassifyMessageRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $result = $this->classificationService->classify($validated['message']);

        if (!$result) {
            return $this->errorResponse('Failed to classify message. Service may be unavailable.', 503);
        }

        return $this->successResponse($result, 'Classification successful');
    }
}
