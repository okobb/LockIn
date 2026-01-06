<?php

declare(strict_types=1);

namespace App\Http\DTOs;

use App\Models\User;

readonly class AuthPayload
{
    public function __construct(
        public User $user,
        public string $token,
        public string $tokenType = 'bearer',
        public int $expiresIn = 3600
    ) {}

    /**
     * Named constructor for consistency
     */
    public static function from(User $user, string $token): self
    {
        return new self($user, $token);
    }
}