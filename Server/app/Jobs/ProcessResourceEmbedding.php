<?php

namespace App\Jobs;

use App\Models\KnowledgeResource;
use App\Services\RAGService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessResourceEmbedding implements ShouldQueue
{
    use Queueable, Dispatchable, InteractsWithQueue, SerializesModels;

    public function __construct(
        public KnowledgeResource $resource
    ) {}

    public function handle(RAGService $ragService): void
    {      
        $ragService->indexResource($this->resource);
    }
}
