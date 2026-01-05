<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\DTOs\AuthPayload;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property AuthPayload $resource
 */
class AuthResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'user' => [
                'id' => $this->resource->user->id,
                'name' => $this->resource->user->name,
                'email' => $this->resource->user->email,
            ],
            'authorization' => [
                'token' => $this->resource->token,
                'type' => $this->resource->tokenType,
                'expires_in' => $this->resource->expiresIn,
            ],
        ];
    }
}