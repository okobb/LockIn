<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

final class AuthService
{
    /**
     * @throws AuthenticationException
     * @return array{user: User, token: string}
     */
    public function login(array $credentials): array
    {
        $token = Auth::attempt($credentials);

        if (!$token) {
            throw new AuthenticationException('Invalid credentials provided.');
        }

        /** @var User $user */
        $user = Auth::user();

        return ['user' => $user, 'token' => (string) $token];
    }

    /**
     * @return array{user: User, token: string}
     */
    public function register(array $data): array
    {
        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $user->sendEmailVerificationNotification();

        $token = (string) Auth::login($user);

        return ['user' => $user, 'token' => $token];
    }

    /**
     * @return array{user: User, token: string}
     */
    public function refresh(): array
    {
        // Refresh the token (works even if expired, as long as within refresh window)
        $token = (string) Auth::refresh();
        
        // Get the user associated with the new token
        /** @var User $user */
        $user = Auth::setToken($token)->user();

        return ['user' => $user, 'token' => $token];
    }

    public function logout(): void
    {
        Auth::logout();
    }

    public function verifyEmail(User $user, string $hash): bool
    {
        if (!hash_equals(sha1($user->email), $hash)) {
            return false;
        }

        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return true;
    }

    public function resendVerification(User $user): void
    {
        $user->sendEmailVerificationNotification();
    }

    /**
     * Login or register a user from OAuth provider data.
     *
     * @return array{user: User, token: string, is_new: bool}
     */
    public function loginOrRegisterFromOAuth(string $email, string $name, ?string $avatar = null): array
    {
        $user = User::where('email', $email)->first();
        $isNew = false;

        if (!$user) {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make(Str::random(32)), 
                'email_verified_at' => now(), 
            ]);
            $isNew = true;
        }

        $token = (string) Auth::login($user);

        return ['user' => $user, 'token' => $token, 'is_new' => $isNew];
    }
}