<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\CalendarEvent
 */
final class CalendarEventResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Get user timezone, fallback to UTC
        $userTimezone = $request->user()?->timezone ?? 'UTC';
        
        $startTime = $this->start_time?->copy()->setTimezone($userTimezone);
        $endTime = $this->end_time?->copy()->setTimezone($userTimezone);
        
        return [
            'id' => $this->id,
            'external_id' => $this->external_id,
            'title' => $this->title,
            'start_time' => $startTime?->toIso8601String(),
            'end_time' => $endTime?->toIso8601String(),
            'status' => $this->status,
            'type' => $this->type,
            'priority' => ($this->metadata ?? [])['priority'] ?? null,
            'tags' => ($this->metadata ?? [])['tags'] ?? [],
            'description' => ($this->metadata ?? [])['description'] ?? null,
            'auto_save_enabled' => $this->auto_save_enabled,
            'metadata' => $this->when(
                $request->query('include_metadata') === 'true',
                $this->metadata
            ),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
