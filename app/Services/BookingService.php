<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Models\DangKy;
use App\Models\SuKien;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookingService
{
    public function __construct(
        protected CryptoService $cryptoService
    ) {}

    /**
     * Book ticket for student adhering to Lock Ordering & Core Invariants (UC-BOOK-01, FR-14).
     *
     * Deadlock-Free Lock Ordering:
     * tai_khoan -> su_kien -> dang_ky
     */
    public function bookTicket(int $userId, int $eventId): DangKy
    {
        return DB::transaction(function () use ($userId, $eventId) {
            // 1. Lock user row to serialize concurrent booking attempts by the same student
            $user = User::query()->where('ma_tai_khoan', $userId)->lockForUpdate()->first();
            if (! $user) {
                throw new BusinessException('USER_NOT_FOUND', 'Không tìm thấy thông tin tài khoản sinh viên.', null, 404);
            }

            if (! $user->isSinhVien()) {
                throw new BusinessException('FORBIDDEN', 'Chỉ tài khoản sinh viên mới được quyền đăng ký vé tham dự.', null, 403);
            }

            // 2. Lock target event row to protect ticket inventory consistency
            $event = SuKien::query()->where('ma_su_kien', $eventId)->lockForUpdate()->first();
            if (! $event) {
                throw new BusinessException('EVENT_NOT_FOUND', 'Không tìm thấy sự kiện.', null, 404);
            }

            // 3. Validate event status & registration time window
            $this->validateRegistrationEligibility($event);

            // 4. Check if student already holds an active ticket for this event
            $existingTicket = DangKy::query()
                ->where('ma_tai_khoan', $userId)
                ->where('ma_su_kien', $eventId)
                ->where('trang_thai', '!=', 'DaHuy')
                ->first();

            if ($existingTicket) {
                throw new BusinessException(
                    'ALREADY_REGISTERED',
                    'Bạn đã đăng ký vé tham dự sự kiện này trước đó.',
                    null,
                    409
                );
            }

            // 5. Hard Block for schedule conflict between 2 limited-slot events
            $this->checkScheduleConflict($userId, $event);

            // 6. Deduct ticket inventory for limited-slot events
            if (! $event->khong_gioi_han_slot) {
                if ($event->so_ve_con_lai === null || $event->so_ve_con_lai <= 0) {
                    throw new BusinessException(
                        'SLOT_SOLD_OUT',
                        'Sự kiện vừa hết vé! Bạn có thể tham gia Hàng đợi Danh sách Chờ (Waitlist).',
                        null,
                        409
                    );
                }

                $event->so_ve_con_lai = $event->so_ve_con_lai - 1;
                if ($event->so_ve_con_lai === 0 && $event->thoi_diem_het_ve === null) {
                    $event->thoi_diem_het_ve = now();
                }
                $event->save();
            }

            // 7. Generate UUID v4 & HMAC-SHA256 signature
            $uuid = (string) Str::uuid();
            $signature = $this->cryptoService->signTicket($uuid, $userId, $eventId);

            // 8. Create ticket record in dang_ky
            $ticket = DangKy::create([
                'ma_tai_khoan' => $userId,
                'ma_su_kien' => $eventId,
                'ma_ve_uuid' => $uuid,
                'chu_ky_hmac' => $signature,
                'trang_thai' => 'DaDangKy',
                'thoi_gian_dang_ky' => now(),
                'da_check_in' => 0,
                'da_check_out' => 0,
                'nghi_van_gian_lan' => 0,
                'tham_gia_tron_ven' => 0,
                'tham_gia_mot_phan' => 0,
                'ti_le_drl' => 0.00,
                'da_feedback' => 0,
                'du_dieu_kien_drl' => 0,
                'vi_pham_no_show' => 0,
                'da_gui_nhac_nho' => 0,
            ]);

            $ticket->load(['suKien.phongHoiTruong', 'chungNhan']);

            return $ticket;
        });
    }

    /**
     * Validate event state and time window before booking.
     */
    protected function validateRegistrationEligibility(SuKien $event): void
    {
        $now = now();

        // Unlimited slot events allow PUBLISHED or HAPPENING
        if ($event->khong_gioi_han_slot) {
            if (! in_array($event->trang_thai, ['PUBLISHED', 'HAPPENING'], true)) {
                throw new BusinessException(
                    'REGISTRATION_CLOSED',
                    'Sự kiện không ở trạng thái cho phép đăng ký.',
                    null,
                    409
                );
            }

            if ($event->thoi_gian_ket_thuc && $now->gte(Carbon::parse($event->thoi_gian_ket_thuc))) {
                throw new BusinessException(
                    'REGISTRATION_CLOSED',
                    'Sự kiện đã kết thúc, không thể đăng ký.',
                    null,
                    409
                );
            }
        } else {
            // Limited slot events only allow PUBLISHED
            if ($event->trang_thai !== 'PUBLISHED') {
                throw new BusinessException(
                    'REGISTRATION_CLOSED',
                    'Sự kiện không ở trạng thái cho phép đăng ký.',
                    null,
                    409
                );
            }

            // Cutoff at T - 2h
            $cutoff = Carbon::parse($event->thoi_gian_bat_dau)->subHours(2);
            if ($now->gte($cutoff)) {
                throw new BusinessException(
                    'REGISTRATION_CLOSED',
                    'Đã đóng đăng ký: danh sách tham dự được chốt từ 2 giờ trước khi sự kiện bắt đầu.',
                    null,
                    409
                );
            }
        }

        // Check if event has reached open registration time
        if ($event->ngay_cong_bo && $now->lt(Carbon::parse($event->ngay_cong_bo))) {
            throw new BusinessException(
                'REGISTRATION_CLOSED',
                'Chưa đến thời gian mở đăng ký sự kiện.',
                null,
                409
            );
        }
    }

    /**
     * Hard block when student holds a ticket for another limited-slot event overlapping in time.
     */
    protected function checkScheduleConflict(int $userId, SuKien $newEvent): void
    {
        $newStart = Carbon::parse($newEvent->thoi_gian_bat_dau);
        $newEnd = Carbon::parse($newEvent->thoi_gian_ket_thuc);

        // Retrieve student's active tickets
        $activeTickets = DangKy::query()
            ->where('ma_tai_khoan', $userId)
            ->where('trang_thai', '!=', 'DaHuy')
            ->where('ma_su_kien', '!=', $newEvent->ma_su_kien)
            ->with(['suKien.phongHoiTruong'])
            ->get();

        foreach ($activeTickets as $ticket) {
            $otherEvent = $ticket->suKien;
            if (! $otherEvent) {
                continue;
            }

            $otherStart = Carbon::parse($otherEvent->thoi_gian_bat_dau);
            $otherEnd = Carbon::parse($otherEvent->thoi_gian_ket_thuc);

            // Time intersection check: Start_new < End_other && End_new > Start_other
            if ($newStart->lt($otherEnd) && $newEnd->gt($otherStart)) {
                // Hard Block only when BOTH events are limited slot (khong_gioi_han_slot = 0)
                if (! $newEvent->khong_gioi_han_slot && ! $otherEvent->khong_gioi_han_slot) {
                    $phong = $otherEvent->phongHoiTruong;
                    $details = [
                        'su_kien_trung' => [
                            'ma_su_kien' => (int) $otherEvent->ma_su_kien,
                            'ten_su_kien' => (string) $otherEvent->ten_su_kien,
                            'thoi_gian_bat_dau' => $otherStart->setTimezone('+07:00')->toIso8601String(),
                            'thoi_gian_ket_thuc' => $otherEnd->setTimezone('+07:00')->toIso8601String(),
                            'ten_phong' => (string) ($phong?->ten_phong ?? ''),
                        ],
                    ];

                    throw new BusinessException(
                        'SCHEDULE_CONFLICT_HARD',
                        sprintf(
                            "Không thể đăng ký! Bạn đang giữ vé của sự kiện giới hạn slot '%s' diễn ra trùng khung giờ.",
                            $otherEvent->ten_su_kien
                        ),
                        $details,
                        409
                    );
                }
            }
        }
    }
}
