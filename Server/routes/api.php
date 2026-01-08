<?php

declare(strict_types=1);

use App\Http\Controllers\AuthController;
use App\Http\Controllers\IntegrationController;
use App\Http\Controllers\SocialAuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WebhookController;
use Illuminate\Support\Facades\Route;

// Public Auth Routes
Route::post('login', [AuthController::class, 'login'])->name('login');
Route::post('register', [AuthController::class, 'register'])->name('register');
Route::get('email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware(['signed'])
    ->name('verification.verify');

// OAuth Login Routes (Public)
Route::prefix('auth')->group(function () {
    Route::get('{provider}/redirect', [SocialAuthController::class, 'redirect'])->name('oauth.redirect');
    Route::get('{provider}/callback', [SocialAuthController::class, 'callback'])->name('oauth.callback');
});

// Webhook Routes
Route::post('webhooks/incoming', [WebhookController::class, 'incoming'])->name('webhooks.incoming');

// Protected Routes
Route::middleware('auth:api')->group(function () {
    Route::post('refresh', [AuthController::class, 'refresh'])->name('refresh');
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');
    Route::post('email/resend', [AuthController::class, 'resendVerification'])
        ->middleware(['throttle:6,1']) // Limit to 6 requests per minute
        ->name('verification.resend');

    // User Management
    Route::apiResource('users', UserController::class);
    Route::put('users/password', [UserController::class, 'updatePassword'])->name('users.password');

    // Integration Management
    Route::get('integrations', [IntegrationController::class, 'index'])->name('integrations.index');
    Route::get('integrations/connect/{provider}/{service}', [IntegrationController::class, 'redirect'])
        ->name('integrations.redirect');
    Route::get('integrations/callback/{provider}', [IntegrationController::class, 'callback'])
        ->name('integrations.callback');
    Route::delete('integrations/{integration}', [IntegrationController::class, 'destroy'])
        ->name('integrations.destroy');
});
