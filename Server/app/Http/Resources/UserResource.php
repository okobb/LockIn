<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'name'              => $this->name,
            'email'             => $this->email,
            'timezone'          => $this->timezone ?? 'UTC',
            'joined_at'         => $this->created_at->toIso8601String(),
            'last_updated'      => $this->updated_at->toIso8601String(),
            'preferences'       => $this->preferences,
            'urgent_keywords'   => $this->urgent_keywords,
            'weekly_goal_min'   => $this->weekly_goal_min,
        ];
    }
}