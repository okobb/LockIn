<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\AuthPayload;
use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Auth;

final class AuthService
{
    /**
     * @throws AuthenticationException
     */
    public function login(array $credentials): AuthPayload
    {
        $token = Auth::attempt($credentials);

        if (!$token) {
            throw new AuthenticationException('Invalid credentials provided.');
        }

        /** @var User $user */
        $user = Auth::user();

        // Cast to string to ensure strictly typed DTO
        return AuthPayload::from($user, (string) $token);  
    }

    public function register(array $data): AuthPayload
    {
        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => $data['password'], 
        ]);

        // 2. Login & Generate Token
        $token = (string) Auth::login($user);

        return AuthPayload::from($user, $token);
    }

    public function refresh(): AuthPayload
    {
        /** @var User $user */
        $user = Auth::user();
        $token = (string) Auth::refresh();

        return AuthPayload::from($user, $token);
    }

    public function logout(): void
    {
        Auth::logout();
    }
}