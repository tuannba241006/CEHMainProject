<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Mail\TicketBookedMailable;
use App\Models\DangKy;
use App\Models\SuKien;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
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

            // 9. Queue electronic ticket & QR confirmation email after commit (UC-BOOK-01 Bước 5)
            if (! empty($user->email)) {
                DB::afterCommit(function () use ($ticket, $user) {
                    try {
                        Mail::to($user->email)->queue(new TicketBookedMailable($ticket, $user));
                    } catch (\Throwable $e) {
                        Log::warning('Failed to queue ticket confirmation email', [
                            'ma_dang_ky' => $ticket->ma_dang_ky,
                            'ma_tai_khoan' => $user->ma_tai_khoan,
                            'error' => $e->getMessage(),
                        ]);
                    }
                });
            }

            return $ticket;
        });
    }

    /**
     * Precheck booking eligibility & personal schedule overlaps (UC-BOOK-01 Bước 2, OpenAPI BookingPrecheck).
     *
     * @return array<string, mixed>
     */
    public function precheckBooking(User $user, int $eventId): array
    {
        $event = SuKien::query()
            ->with('phongHoiTruong')
            ->findOrFail($eventId);

        $isUnlimited = (bool) $event->khong_gioi_han_slot;

        $basePayload = [
            'co_the_dat' => true,
            'khong_gioi_han_slot' => $isUnlimited,
            'ly_do_chan' => null,
            'canh_bao_trung_lich_mem' => null,
            'su_kien_trung' => [],
        ];

        // 1. Sinh viên đã có vé hiệu lực tại sự kiện này chưa?
        $existingTicket = DangKy::query()
            ->where('ma_su_kien', $eventId)
            ->where('ma_tai_khoan', $user->ma_tai_khoan)
            ->where('trang_thai', '!=', 'DaHuy')
            ->exists();

        if ($existingTicket) {
            return array_merge($basePayload, [
                'co_the_dat' => false,
                'ly_do_chan' => 'ALREADY_REGISTERED',
            ]);
        }

        // 2. Sự kiện có đang mở cổng & còn trong hạn T-2h / chưa kết thúc không?
        if ($this->getRegistrationClosureReason($event) !== null) {
            return array_merge($basePayload, [
                'co_the_dat' => false,
                'ly_do_chan' => 'REGISTRATION_CLOSED',
            ]);
        }

        // 3. Nếu giới hạn slot, còn vé khả dụng không?
        if (! $isUnlimited && ($event->so_ve_con_lai === null || (int) $event->so_ve_con_lai <= 0)) {
            return array_merge($basePayload, [
                'co_the_dat' => false,
                'ly_do_chan' => 'SLOT_SOLD_OUT',
            ]);
        }

        // 4. Kiểm tra giao thoa khung giờ với các vé hiệu lực hiện có
        $conflicts = $this->findScheduleConflicts((int) $user->ma_tai_khoan, $event);

        if ($conflicts['hard'] !== []) {
            return array_merge($basePayload, [
                'co_the_dat' => false,
                'ly_do_chan' => 'SCHEDULE_CONFLICT_HARD',
                'su_kien_trung' => $conflicts['all'],
            ]);
        }

        if ($conflicts['all'] !== []) {
            return array_merge($basePayload, [
                'co_the_dat' => true,
                'canh_bao_trung_lich_mem' => 'Lưu ý: Sự kiện này trùng khung giờ với sự kiện bạn đã đăng ký. Bạn vẫn có thể đăng ký nhưng vui lòng tự cân nhắc sắp xếp thời gian.',
                'su_kien_trung' => $conflicts['all'],
            ]);
        }

        return $basePayload;
    }

    /**
     * Validate event state and time window before booking.
     */
    protected function validateRegistrationEligibility(SuKien $event): void
    {
        $reason = $this->getRegistrationClosureReason($event);
        if ($reason !== null) {
            throw new BusinessException('REGISTRATION_CLOSED', $reason, null, 409);
        }
    }

    /**
     * Return closure error message if event is outside registration window, or null when open.
     */
    protected function getRegistrationClosureReason(SuKien $event): ?string
    {
        $now = now();

        if ($event->khong_gioi_han_slot) {
            if (! in_array($event->trang_thai, ['PUBLISHED', 'HAPPENING'], true)) {
                return 'Sự kiện không ở trạng thái cho phép đăng ký.';
            }

            if ($event->thoi_gian_ket_thuc && $now->gte(Carbon::parse($event->thoi_gian_ket_thuc))) {
                return 'Sự kiện đã kết thúc, không thể đăng ký.';
            }
        } else {
            if ($event->trang_thai !== 'PUBLISHED') {
                return 'Sự kiện không ở trạng thái cho phép đăng ký.';
            }

            $cutoff = Carbon::parse($event->thoi_gian_bat_dau)->subHours(2);
            if ($now->gte($cutoff)) {
                return 'Đã đóng đăng ký: danh sách tham dự được chốt từ 2 giờ trước khi sự kiện bắt đầu.';
            }
        }

        if ($event->ngay_cong_bo && $now->lt(Carbon::parse($event->ngay_cong_bo))) {
            return 'Chưa đến thời gian mở đăng ký sự kiện.';
        }

        return null;
    }

    /**
     * Hard block when student holds a ticket for another limited-slot event overlapping in time.
     */
    protected function checkScheduleConflict(int $userId, SuKien $newEvent): void
    {
        $conflicts = $this->findScheduleConflicts($userId, $newEvent);
        if ($conflicts['hard'] === []) {
            return;
        }

        $firstHard = $conflicts['hard'][0];

        $details = [
            'su_kien_trung' => [
                'ma_su_kien' => $firstHard['ma_su_kien'],
                'ten_su_kien' => $firstHard['ten_su_kien'],
                'thoi_gian_bat_dau' => $firstHard['thoi_gian_bat_dau'],
                'thoi_gian_ket_thuc' => $firstHard['thoi_gian_ket_thuc'],
                'ten_phong' => $firstHard['ten_phong'],
            ],
        ];

        throw new BusinessException(
            'SCHEDULE_CONFLICT_HARD',
            sprintf(
                "Không thể đăng ký! Bạn đang giữ vé của sự kiện giới hạn slot '%s' diễn ra trùng khung giờ. Để tránh chiếm chỗ ảo, vui lòng hủy vé sự kiện cũ (trước mốc T-4h) nếu muốn tham gia sự kiện này.",
                $firstHard['ten_su_kien']
            ),
            $details,
            409
        );
    }

    /**
     * Find overlapping active tickets and classify hard vs soft conflicts.
     *
     * @return array{all: array<int, array<string, mixed>>, hard: array<int, array<string, mixed>>}
     */
    protected function findScheduleConflicts(int $userId, SuKien $newEvent): array
    {
        $newStart = Carbon::parse($newEvent->thoi_gian_bat_dau);
        $newEnd = Carbon::parse($newEvent->thoi_gian_ket_thuc);

        $activeTickets = DangKy::query()
            ->where('ma_tai_khoan', $userId)
            ->where('trang_thai', '!=', 'DaHuy')
            ->where('ma_su_kien', '!=', $newEvent->ma_su_kien)
            ->with(['suKien.phongHoiTruong'])
            ->get();

        $all = [];
        $hard = [];

        foreach ($activeTickets as $ticket) {
            $otherEvent = $ticket->suKien;
            if (! $otherEvent || $otherEvent->trang_thai === 'CANCELLED') {
                continue;
            }

            $otherStart = Carbon::parse($otherEvent->thoi_gian_bat_dau);
            $otherEnd = Carbon::parse($otherEvent->thoi_gian_ket_thuc);

            if ($newStart->lt($otherEnd) && $newEnd->gt($otherStart)) {
                $item = [
                    'ma_su_kien' => (int) $otherEvent->ma_su_kien,
                    'ten_su_kien' => (string) $otherEvent->ten_su_kien,
                    'thoi_gian_bat_dau' => $otherStart->copy()->setTimezone('+07:00')->toIso8601String(),
                    'thoi_gian_ket_thuc' => $otherEnd->copy()->setTimezone('+07:00')->toIso8601String(),
                    'khong_gioi_han_slot' => (bool) $otherEvent->khong_gioi_han_slot,
                    'ten_phong' => (string) ($otherEvent->phongHoiTruong?->ten_phong ?? ''),
                ];

                $all[] = $item;

                if (! $newEvent->khong_gioi_han_slot && ! $otherEvent->khong_gioi_han_slot) {
                    $hard[] = $item;
                }
            }
        }

        return [
            'all' => $all,
            'hard' => $hard,
        ];
    }
}
