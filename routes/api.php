<?php

use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AttendanceOverrideController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\DrlController;
use App\Http\Controllers\Api\EventAnalyticsController;
use App\Http\Controllers\Api\EventCatalogController;
use App\Http\Controllers\Api\EventCoHostController;
use App\Http\Controllers\Api\EventEmergencyController;
use App\Http\Controllers\Api\EventOrganizerController;
use App\Http\Controllers\Api\EventPublicDetailController;
use App\Http\Controllers\Api\EventReviewController;
use App\Http\Controllers\Api\EventShareController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\KioskSessionController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\RoomScheduleController;
use App\Http\Controllers\Api\SelfAttendanceController;
use App\Http\Controllers\Api\StaffAttendanceController;
use App\Http\Controllers\Api\TicketCancelController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\WaitlistController;
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

// PKG-04: Public Event Discovery (UC-DISC-01)
// API versioned: /api/v1/...
Route::get('/v1/events', [EventCatalogController::class, 'index'])->name('v1.events.public.index');

Route::get('/v1/topics', [EventCatalogController::class, 'topics'])->name('v1.topics.public.index');

// Root API aliases: /api/...
Route::get('/events', [EventCatalogController::class, 'index'])->name('events.public.index');

Route::get('/topics', [EventCatalogController::class, 'topics'])->name('topics.public.index');
Route::get('/v1/events/{id}', [EventPublicDetailController::class, 'show'])->whereNumber('id')->name('v1.events.public.show');

Route::get('/events/{id}', [EventPublicDetailController::class, 'show'])->whereNumber('id')->name('events.public.show');
Route::get('/v1/events/{id}/share', [EventShareController::class, 'show'])->whereNumber('id')->name('v1.events.public.share');

Route::get('/events/{id}/share', [EventShareController::class, 'show'])->whereNumber('id')->name('events.public.share');
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
        Route::match(['put', 'post'], '/change-password', [AuthController::class, 'changePassword'])->name('auth.change-password');
    });
};

// Admin routes definition (UC-ADM-01, UC-REP-02)
$adminRoutes = function () {
    Route::middleware(['auth:sanctum,web', 'role:Admin', 'password.changed'])->group(function () {
        Route::get('/users', [AdminUserController::class, 'index'])->name('admin.users.index');
        Route::post('/users', [AdminUserController::class, 'createInternal'])->name('admin.users.create');
        Route::post('/users/create-internal', [AdminUserController::class, 'createInternal'])->name('admin.users.create-internal');
        Route::get('/analytics/macro', [EventAnalyticsController::class, 'macroAnalytics'])->name('admin.analytics.macro');
        Route::get('/analytics/no-show-violations', [EventAnalyticsController::class, 'noShowViolations'])->name('admin.analytics.no-show');
        Route::get('/analytics/macro/export', [EventAnalyticsController::class, 'exportMacro'])->name('admin.analytics.macro.export');
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
        // Event lifecycle - Host A
        Route::post('/', [EventOrganizerController::class, 'store'])->name('events.store');
        Route::put('/{id}', [EventOrganizerController::class, 'update'])->name('events.update');

        // Co-host workflow
        Route::post('/{id}/submit-approval', [EventCoHostController::class, 'submitApproval'])->name('events.submit-approval');
        Route::post('/{id}/co-host-respond', [EventCoHostController::class, 'respondInvitation'])->name('events.co-host-respond');
        Route::post('/{id}/withdraw', [EventCoHostController::class, 'withdrawProposal'])->name('events.withdraw');

        // Review queue (GET /events/review-queue)
        Route::get('/review-queue', [EventReviewController::class, 'reviewQueue'])->name('events.review-queue');

        // Multi-level event approval workflow (CEH-P2-EVT-03)
        Route::post('/{id}/review', [EventReviewController::class, 'review'])->name('events.review');
        Route::post('/{id}/reopen', [EventReviewController::class, 'reopen'])->name('events.reopen');

        // Emergency cancellation & room change (CEH-P2-EVT-04)
        Route::post('/{id}/emergency-cancel', [EventEmergencyController::class, 'emergencyCancel'])->name('events.emergency-cancel');
        Route::post('/{id}/change-room', [EventEmergencyController::class, 'changeRoom'])->name('events.change-room');
    });

    // PKG-05: Concurrency ticket booking (UC-BOOK-01, FR-14)
    Route::middleware(['auth:sanctum,web', 'role:SinhVien', 'password.changed'])->group(function () {
        Route::post('/{id}/book', [BookingController::class, 'bookTicket'])->name('events.book');
    });
};

$organizerRoutes = function () {
    Route::middleware(['auth:sanctum,web', 'role:ToChuc,Admin', 'password.changed'])->group(function () {
        Route::get('/events', [EventOrganizerController::class, 'index'])->name('organizer.events.index');
        Route::get('/events/{id}', [EventOrganizerController::class, 'show'])->name('organizer.events.show');
        Route::get('/cohost-invitations', [EventCoHostController::class, 'listInvitations'])->name('organizer.cohost-invitations');
    });
};

// PKG-06: Ticket wallet & cancellation routes definition (UC-TCK-01, UC-TCK-02)
$ticketRoutes = function () {
    Route::middleware(['auth:sanctum,web', 'password.changed'])->group(function () {
        // SinhVien: ví vé cá nhân & hủy vé
        Route::middleware('role:SinhVien')->group(function () {
            Route::get('/my-tickets', [TicketController::class, 'myTickets'])->name('my-tickets');
            Route::post('/{id}/cancel', [TicketCancelController::class, 'cancel'])->whereNumber('id')->name('cancel');
        });

        // SinhVien (chủ vé) & Admin: xem chi tiết vé
        Route::middleware('role:SinhVien,Admin')->group(function () {
            Route::get('/{id}', [TicketController::class, 'show'])->whereNumber('id')->name('show');
        });
    });
};

// PKG-06: In-app Notification center routes definition (UC-NOTIF-01)
$notificationRoutes = function () {
    Route::middleware(['auth:sanctum,web', 'role:SinhVien,ToChuc,Admin', 'password.changed'])->group(function () {
        Route::get('/', [NotificationController::class, 'index'])->name('index');
        Route::put('/read-all', [NotificationController::class, 'markAllAsRead'])->name('read-all');
        Route::put('/{id}/read', [NotificationController::class, 'markAsRead'])->whereNumber('id')->name('read');
    });
};

// PKG-07: FIFO waitlist and offer claim routes (UC-BOOK-02, UC-BOOK-03).
$waitlistRoutes = function () {
    Route::middleware(['auth:sanctum,web', 'role:SinhVien', 'password.changed'])->group(function () {
        Route::post('/events/{id}/waitlist', [WaitlistController::class, 'join'])
            ->whereNumber('id')->middleware('throttle:10,1')->name('waitlist.join');
        Route::get('/waitlist/my-entries', [WaitlistController::class, 'index'])->name('waitlist.my-entries');
        Route::post('/waitlist/{id}/claim', [WaitlistController::class, 'claim'])
            ->whereNumber('id')->middleware('throttle:10,1')->name('waitlist.claim');
        Route::post('/waitlist/{id}/decline', [WaitlistController::class, 'decline'])
            ->whereNumber('id')->name('waitlist.decline');
    });
};

// PKG-08: Kiosk, HMAC staff scanning and two-way attendance operations.
$attendanceRoutes = function () {
    Route::middleware(['auth:sanctum,web', 'role:ToChuc,Admin', 'password.changed'])->group(function () {
        Route::post('/events/{id}/kiosk/start', [KioskSessionController::class, 'startKiosk'])->whereNumber('id');
        Route::post('/events/{id}/kiosk/open-checkin', [KioskSessionController::class, 'openCheckIn'])->whereNumber('id');
        Route::post('/events/{id}/kiosk/open-checkout', [KioskSessionController::class, 'openCheckOut'])->whereNumber('id');
        Route::post('/events/{id}/kiosk/close-gates', [KioskSessionController::class, 'closeGates'])->whereNumber('id');
        Route::get('/events/{id}/participants', [SelfAttendanceController::class, 'participants'])->whereNumber('id');
        Route::get('/events/{id}/staff', [StaffAttendanceController::class, 'listStaff'])->whereNumber('id');
        Route::post('/events/{id}/staff', [StaffAttendanceController::class, 'assignStaff'])->whereNumber('id');
        Route::delete('/events/{id}/staff/{user_id}', [StaffAttendanceController::class, 'removeStaff'])->whereNumber('id')->whereNumber('user_id');
        Route::post('/attendance/manual-override', [AttendanceOverrideController::class, 'manualOverride']);
    });
    Route::get('/kiosk/totp-stream', [KioskSessionController::class, 'totpStream']);
    Route::middleware(['auth:sanctum,web', 'role:SinhVien,ToChuc,Admin', 'password.changed'])->group(function () {
        Route::get('/staff/my-events', [StaffAttendanceController::class, 'myStaffEvents']);
        Route::post('/attendance/staff-scan', [StaffAttendanceController::class, 'staffScan']);
    });
    Route::middleware(['auth:sanctum,web', 'role:SinhVien', 'password.changed', 'throttle:10,1,attendance:'])->group(function () {
        Route::post('/attendance/self-check-in', [SelfAttendanceController::class, 'selfCheckIn']);
        Route::post('/attendance/self-check-out', [SelfAttendanceController::class, 'selfCheckOut']);
    });
};

// PKG-10: Feedback 48h survey and e-Certificate HMAC (UC-FEED-01, UC-CERT-01)
$feedbackAndCertificateRoutes = function () {
    // Public verification of certificate (no auth required)
    Route::get('/certificates/verify/{hash}', [CertificateController::class, 'verifyPublic'])->name('certificates.verify');

    // Student operations
    Route::middleware(['auth:sanctum,web', 'role:SinhVien', 'password.changed'])->group(function () {
        Route::post('/events/{id}/feedback', [FeedbackController::class, 'submitFeedback'])->whereNumber('id')->name('events.feedback');
        Route::post('/tickets/{id}/certificate', [CertificateController::class, 'issueOrGet'])->whereNumber('id')->name('tickets.certificate');
        Route::get('/certificates/my-certificates', [CertificateController::class, 'myCertificates'])->name('certificates.my');
    });

    // Student (owner) and Admin: Download PDF
    Route::middleware(['auth:sanctum,web', 'role:SinhVien,Admin', 'password.changed'])->group(function () {
        Route::get('/certificates/{id}/download', [CertificateController::class, 'downloadPdf'])->whereNumber('id')->name('certificates.download');
    });

    // Admin operations
    Route::middleware(['auth:sanctum,web', 'role:Admin', 'password.changed'])->group(function () {
        Route::post('/admin/tickets/{id}/feedback-grace', [FeedbackController::class, 'grantGrace'])->whereNumber('id')->name('admin.tickets.feedback-grace');
        Route::get('/admin/certificates', [CertificateController::class, 'adminIndex'])->name('admin.certificates.index');
        Route::post('/admin/certificates/{id}/revoke', [CertificateController::class, 'revoke'])->whereNumber('id')->name('admin.certificates.revoke');
    });
};

// PKG-11: DRL Accreditation & Organizer Analytics (UC-DRL-01, UC-REP-01)
$drlAndAnalyticsRoutes = function () {
    Route::middleware(['auth:sanctum,web', 'role:ToChuc,Admin', 'password.changed'])->group(function () {
        Route::get('/events/{id}/drl', [DrlController::class, 'index'])->whereNumber('id')->name('events.drl.index');
        Route::post('/events/{id}/drl/lock', [DrlController::class, 'lock'])->whereNumber('id')->name('events.drl.lock');
        Route::get('/events/{id}/drl/export', [DrlController::class, 'export'])->whereNumber('id')->name('events.drl.export');
        Route::get('/organizer/events/{id}/analytics', [EventAnalyticsController::class, 'showAnalytics'])->whereNumber('id')->name('organizer.events.analytics');
    });

    Route::middleware(['auth:sanctum,web', 'role:Admin', 'password.changed'])->group(function () {
        Route::post('/events/{id}/drl/unlock', [DrlController::class, 'unlock'])->whereNumber('id')->name('events.drl.unlock');
    });
};

// Version 1 API routes (/api/v1/...)
Route::prefix('v1')->group(function () use ($authRoutes, $adminRoutes, $roomRoutes, $eventRoutes, $organizerRoutes, $ticketRoutes, $notificationRoutes, $attendanceRoutes, $waitlistRoutes, $feedbackAndCertificateRoutes, $drlAndAnalyticsRoutes) {
    Route::prefix('auth')->group($authRoutes);
    Route::prefix('admin')->group($adminRoutes);
    Route::prefix('rooms')->group($roomRoutes);
    Route::prefix('events')->name('v1.')->group($eventRoutes);
    Route::prefix('organizer')->name('v1.')->group($organizerRoutes);
    Route::prefix('tickets')->name('v1.tickets.')->group($ticketRoutes);
    Route::prefix('notifications')->name('v1.notifications.')->group($notificationRoutes);
    $waitlistRoutes();
    $attendanceRoutes();
    $feedbackAndCertificateRoutes();
    $drlAndAnalyticsRoutes();
});

// Root API alias routes (/api/...)
Route::prefix('auth')->group($authRoutes);
Route::prefix('admin')->group($adminRoutes);
Route::prefix('rooms')->group($roomRoutes);
Route::prefix('events')->group($eventRoutes);
Route::prefix('organizer')->group($organizerRoutes);
Route::prefix('tickets')->name('tickets.')->group($ticketRoutes);
Route::prefix('notifications')->name('notifications.')->group($notificationRoutes);
$waitlistRoutes();
$attendanceRoutes();
$feedbackAndCertificateRoutes();
$drlAndAnalyticsRoutes();
