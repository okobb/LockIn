<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuthResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'user' => [
                'id' => $this->resource['user']->id,
                'name' => $this->resource['user']->name,
                'email' => $this->resource['user']->email,
                'timezone' => $this->resource['user']->timezone,
                'weekly_goal_min' => $this->resource['user']->weekly_goal_min,
            ],
            'authorization' => [
                'token' => $this->resource['token'],
                'type' => 'bearer',
                'expires_in' => 3600,
            ],
        ];
    }
}