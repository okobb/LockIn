<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

/**
 * @mixin Task
 * @property Carbon|null $due_date
 */
class TaskResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'priority' => $this->priority,
            'priority_label' => $this->getPriorityLabel(),
            'status' => $this->status,
            'source_type' => $this->source_type,
            'source_link' => $this->source_link,
            'ai_reasoning' => $this->ai_reasoning,
            'due_date' => $this->due_date?->toDateString(),
            'estimated_minutes' => $this->estimated_minutes,
            'scheduled_start' => $this->scheduled_start?->toIso8601String(),
            'scheduled_end' => $this->scheduled_end?->toIso8601String(),
            'progress_percent' => $this->progress_percent,
            'completed_at' => $this->completed_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'time_ago' => $this->created_at->diffForHumans(),
        ];
    }

    private function getPriorityLabel(): string
    {
        return match ($this->priority) {
            1 => 'critical',
            2 => 'high',
            3 => 'normal',
            4 => 'low',
            default => 'normal',
        };
    }
}
