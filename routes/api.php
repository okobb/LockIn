<?php

declare(strict_types=1);

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Public Auth Routes
Route::post('login', [AuthController::class, 'login'])->name('login');
Route::post('register', [AuthController::class, 'register'])->name('register');

// Protected Routes
Route::middleware('auth:api')->group(function () {
    Route::post('refresh', [AuthController::class, 'refresh'])->name('refresh');
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');

    // User Management
    Route::apiResource('users', UserController::class);
    Route::put('users/password', [UserController::class, 'updatePassword'])->name('users.password');
});
