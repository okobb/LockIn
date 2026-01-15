<?php

declare(strict_types=1);

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\ContextSnapshotController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\IntegrationController;
use App\Http\Controllers\N8nController;
use App\Http\Controllers\SocialAuthController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\FocusSessionController;
use App\Http\Controllers\UserController;
use App\Http\Middleware\N8nAuthMiddleware;
use Illuminate\Support\Facades\Route;

// Public Auth Routes
Route::post('login', [AuthController::class, 'login'])->name('login');
Route::post('register', [AuthController::class, 'register'])->name('register');
Route::get('email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware(['signed'])
    ->name('verification.verify');

// OAuth Login Routes (Public)
Route::prefix('auth')->group(function () {
    Route::post('refresh', [AuthController::class, 'refresh'])->name('refresh');
    Route::get('{provider}/redirect', [SocialAuthController::class, 'redirect'])->name('oauth.redirect');
    Route::get('{provider}/callback', [SocialAuthController::class, 'callback'])->name('oauth.callback');
});

// Integration OAuth Callback (Public - OAuth redirects don't preserve JWT)
Route::get('integrations/callback/{provider}', [IntegrationController::class, 'callback'])
    ->name('integrations.callback');

// Protected Routes
Route::middleware('auth:api')->group(function () {
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
    Route::delete('integrations/{integration}', [IntegrationController::class, 'destroy'])
        ->name('integrations.destroy');

    // Calendar Events
    Route::get('calendar/events', [CalendarController::class, 'index'])->name('calendar.index');
    Route::post('calendar/events', [CalendarController::class, 'store'])->name('calendar.store');
    Route::get('calendar/events/today', [CalendarController::class, 'today'])->name('calendar.today');
    Route::post('calendar/sync', [CalendarController::class, 'sync'])->name('calendar.sync');
    Route::get('calendar/events/{event}', [CalendarController::class, 'show'])->name('calendar.show');
    Route::patch('calendar/events/{event}', [CalendarController::class, 'update'])->name('calendar.update');
    Route::delete('calendar/events/{event}', [CalendarController::class, 'destroy'])->name('calendar.destroy');

    // Tasks
    Route::get('tasks', [TaskController::class, 'index'])->name('tasks.index');
    Route::post('tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::get('tasks/{task}', [TaskController::class, 'show'])->name('tasks.show');
    Route::patch('tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::delete('tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');

    Route::get('tasks/suggestions/list', [TaskController::class, 'suggestions'])->name('tasks.suggestions');

    // Focus Sessions
    Route::post('focus-sessions', [FocusSessionController::class, 'store'])->name('focus-sessions.store');
    
    // Context Snapshots
    Route::post('context/save', [ContextSnapshotController::class, 'store'])->name('context.save');

    // Dashboard
    Route::get('dashboard/stats', [DashboardController::class, 'stats'])->name('dashboard.stats');
    Route::get('dashboard/priority-tasks', [DashboardController::class, 'priorityTasks'])->name('dashboard.priority-tasks');
    Route::get('dashboard/upcoming', [DashboardController::class, 'upcoming'])->name('dashboard.upcoming');
    Route::get('dashboard/communications', [DashboardController::class, 'communications'])->name('dashboard.communications');
});

// n8n API Routes (authenticated via secret header)
Route::prefix('n8n')->middleware(N8nAuthMiddleware::class)->group(function () {
    Route::get('users/active', [N8nController::class, 'activeIntegrations'])->name('n8n.users.active');
    Route::post('sync/calendar/{userId}', [N8nController::class, 'syncCalendar'])->name('n8n.sync.calendar');
    Route::post('sync/gmail/{userId}', [N8nController::class, 'syncGmail'])->name('n8n.sync.gmail');
    Route::post('sync/slack/{userId}', [N8nController::class, 'syncSlack'])->name('n8n.sync.slack');
    Route::post('sync/github/{userId}', [N8nController::class, 'syncGitHub'])->name('n8n.sync.github');
    Route::get('messages/unprocessed', [N8nController::class, 'unprocessedMessages'])->name('n8n.messages.unprocessed');
    Route::post('messages/processed', [N8nController::class, 'handleProcessedMessage'])->name('n8n.messages.processed');
});


