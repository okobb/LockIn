<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\DTOs\AuthPayload;
use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

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
            'password' => Hash::make($data['password']), 
        ]);

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