<?php

use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EventCoHostController;
use App\Http\Controllers\Api\EventOrganizerController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\RoomScheduleController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// Health check endpoint
Route::get('/health', function () {
    DB::connection()->getPdo();

    return response()->json([
        'status' => 'ok',
        'service' => 'CEH Main Project API',
        'database' => 'connected',
        'server_time' => now()->setTimezone('+07:00')->toIso8601String(),
    ]);
});

// Authentication & Account routes definition
$authRoutes = function () {
    // Public auth routes (UC-AUTH-01, 02, 04)
    Route::post('/register', [AuthController::class, 'register'])->name('auth.register');
    Route::post('/resend-registration-otp', [AuthController::class, 'resendRegistrationOtp'])->name('auth.resend-otp');
    Route::post('/verify-registration-otp', [AuthController::class, 'verifyRegistrationOtp'])->name('auth.verify-registration');
    Route::post('/login', [AuthController::class, 'login'])->name('auth.login');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('auth.forgot-password');
    Route::post('/verify-forgot-password-otp', [AuthController::class, 'verifyForgotPasswordOtp'])->name('auth.verify-forgot-password');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('auth.reset-password');

    // Authenticated auth routes (UC-AUTH-03, 05)
    Route::middleware(['auth:sanctum,web', 'single.session', 'password.changed'])->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::get('/me', [AuthController::class, 'me'])->name('auth.me');
        Route::put('/profile', [AuthController::class, 'updateProfile'])->name('auth.profile');
        Route::put('/change-password', [AuthController::class, 'changePassword'])->name('auth.change-password');
    });
};

// Admin routes definition (UC-ADM-01)
$adminRoutes = function () {
    Route::middleware(['auth:sanctum,web', 'role:Admin', 'password.changed'])->group(function () {
        Route::get('/users', [AdminUserController::class, 'index'])->name('admin.users.index');
        Route::post('/users', [AdminUserController::class, 'createInternal'])->name('admin.users.create');
        Route::post('/users/create-internal', [AdminUserController::class, 'createInternal'])->name('admin.users.create-internal');
    });
};

// PKG-01: Room management & schedule routes definition
$roomRoutes = function () {
    // GET cho cả Admin và ToChuc (OpenAPI: x-roles: [ToChuc, Admin])
    Route::middleware(['auth:sanctum,web', 'role:Admin,ToChuc'])->group(function () {
        Route::get('/', [RoomController::class, 'index'])->name('rooms.index');
        Route::get('/{id}', [RoomController::class, 'show'])->name('rooms.show');
    });

    // Ghi (POST/PUT/DELETE) chỉ Admin
    Route::middleware(['auth:sanctum,web', 'role:Admin'])->group(function () {
        Route::post('/', [RoomController::class, 'store'])->name('rooms.store');
        Route::put('/{id}', [RoomController::class, 'update'])->name('rooms.update');
        Route::delete('/{id}', [RoomController::class, 'destroy'])->name('rooms.destroy');
    });

    // Admin & ToChuc: Schedule & Availability (CEH-P2-ROOM-02)
    Route::middleware(['auth:sanctum,web', 'role:Admin,ToChuc'])->group(function () {
        Route::get('/{id}/schedule', [RoomScheduleController::class, 'schedule'])->name('rooms.schedule');
        Route::match(['get', 'post'], '/{id}/availability', [RoomScheduleController::class, 'availability'])->name('rooms.availability');
    });
};

// PKG-02: Event Lifecycle & Approval routes definition
$eventRoutes = function () {
    Route::middleware(['auth:sanctum,web', 'role:ToChuc,Admin', 'password.changed'])->group(function () {
        Route::post('/', [EventOrganizerController::class, 'store'])->name('events.store');
        Route::put('/{id}', [EventOrganizerController::class, 'update'])->name('events.update');
        Route::post('/{id}/submit-approval', [EventCoHostController::class, 'submitApproval'])->name('events.submit-approval');
        Route::post('/{id}/co-host-respond', [EventCoHostController::class, 'respondInvitation'])->name('events.co-host-respond');
        Route::post('/{id}/withdraw', [EventCoHostController::class, 'withdrawProposal'])->name('events.withdraw');
    });
};

$organizerRoutes = function () {
    Route::middleware(['auth:sanctum,web', 'role:ToChuc,Admin', 'password.changed'])->group(function () {
        Route::get('/events', [EventOrganizerController::class, 'index'])->name('organizer.events.index');
        Route::get('/events/{id}', [EventOrganizerController::class, 'show'])->name('organizer.events.show');
        Route::get('/cohost-invitations', [EventCoHostController::class, 'listInvitations'])->name('organizer.cohost-invitations');
    });
};

// Version 1 API routes (/api/v1/...)
Route::prefix('v1')->group(function () use ($authRoutes, $adminRoutes, $roomRoutes, $eventRoutes, $organizerRoutes) {
    Route::prefix('auth')->group($authRoutes);
    Route::prefix('admin')->group($adminRoutes);
    Route::prefix('rooms')->group($roomRoutes);
    Route::prefix('events')->name('v1.')->group($eventRoutes);
    Route::prefix('organizer')->name('v1.')->group($organizerRoutes);
});

// Root API alias routes (/api/...)
Route::prefix('auth')->group($authRoutes);
Route::prefix('admin')->group($adminRoutes);
Route::prefix('rooms')->group($roomRoutes);
Route::prefix('events')->group($eventRoutes);
Route::prefix('organizer')->group($organizerRoutes);
