<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Controllers\BaseController;
use App\Services\IncomingMessageService;
use App\Jobs\ProcessIncomingMessageJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class WebhookController extends BaseController
{
    public function __construct(
        private readonly IncomingMessageService $incomingMessageService
    ) {}

    public function incoming(Request $request): JsonResponse
    {
        if ($request->header('X-Webhook-Secret') !== config('services.n8n.secret')) {
            return $this->forbiddenResponse('Invalid Secret');
        }

        $message = $this->incomingMessageService->storeRawPayload(
            payload: $request->all(),
            source: 'n8n',
            ip: $request->ip()
        );

        ProcessIncomingMessageJob::dispatch($message);

        return $this->successResponse(
            data: ['id' => $message->id],
            message: 'Message received and queued',
            statusCode: 202
        );
    }
}