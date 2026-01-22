<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassificationController extends BaseController
{
    /**
     * Classify a message as Important or Noise.
     */
    public function classify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        return $this->successResponse([
            'message' => $validated['message'],
            'status'  => 'pending_classification',
        ], 'Message received for classification');
    }
}
