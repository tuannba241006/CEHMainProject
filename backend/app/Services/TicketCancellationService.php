<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Models\DangKy;
use App\Models\SuKien;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class TicketCancellationService
{
    public function __construct(
        protected AuditLogService $auditLogService,
        protected NotificationService $notificationService,
        protected WaitlistService $waitlistService
    ) {}

    /**
     * Cancel ticket before T-4h deadline and trigger Drain Window (UC-TCK-02, FR-18).
     *
     * @throws ModelNotFoundException
     * @throws AuthorizationException
     * @throws BusinessException
     */
    public function cancelTicket(
        int $ticketId,
        User $user,
        string $reason,
        ?string $idempotencyKey = null
    ): array {
        $reason = trim($reason);

        // 1. Handle Idempotency Key if provided (OpenAPI contract, TTL 5 mins)
        $cacheKey = null;
        // Thay đoạn đọc cache (khoảng dòng 40-53)
        if ($idempotencyKey) {
            $cacheKey = "idempotency:cancel_ticket:{$user->ma_tai_khoan}:{$ticketId}:{$idempotencyKey}";
            $cached = Cache::get($cacheKey);

            if ($cached) {
                if (hash_equals($cached['payload_hash'], md5($reason))) {
                    // Nạp lại từ DB, không unserialize model
                    $ticket = DangKy::with(['suKien.phongHoiTruong', 'chungNhan'])
                        ->findOrFail($cached['ma_dang_ky']);

                    return ['ticket' => $ticket];
                }

                throw new BusinessException(
                    'IDEMPOTENCY_CONFLICT',
                    'Idempotency key đã được sử dụng với payload khác.',
                    null,
                    409
                );
            }
        }

        // 2. Execute Atomic Transaction following global lock ordering:
        // tai_khoan -> su_kien -> dang_ky -> hang_doi_waitlist
        $cancelledTicket = DB::transaction(function () use ($ticketId, $user, $reason) {
            // Step 1: Lock user row
            User::where('ma_tai_khoan', $user->ma_tai_khoan)
                ->lockForUpdate()
                ->first();

            // Step 2: Retrieve ticket and check preliminary existence & ownership
            $ticket = DangKy::find($ticketId);
            if (! $ticket) {
                throw new ModelNotFoundException('Không tìm thấy vé tham dự.');
            }

            if ((int) $ticket->ma_tai_khoan !== (int) $user->ma_tai_khoan) {
                throw new AuthorizationException('Bạn không có quyền hủy vé này.');
            }

            // Step 3: Lock su_kien row
            $suKien = SuKien::where('ma_su_kien', $ticket->ma_su_kien)
                ->lockForUpdate()
                ->first();

            if (! $suKien) {
                throw new ModelNotFoundException('Không tìm thấy sự kiện của vé này.');
            }

            // Step 4: Lock dang_ky row
            $lockedTicket = DangKy::with('suKien.phongHoiTruong')
                ->where('ma_dang_ky', $ticketId)
                ->lockForUpdate()
                ->first();

            // Step 5: Assert valid state transition (Must be DaDangKy)
            if ($lockedTicket->trang_thai !== 'DaDangKy') {
                throw new BusinessException(
                    'INVALID_STATE_TRANSITION',
                    'Chỉ có thể hủy vé khi đang ở trạng thái Đã đăng ký (DaDangKy).',
                    null,
                    409
                );
            }

            // Step 6: Assert T-4h cancellation deadline (NOW() < thoi_gian_bat_dau - 4h)
            $startTime = Carbon::parse($suKien->thoi_gian_bat_dau);
            $deadline = $startTime->copy()->subHours(4);

            if (now()->gte($deadline)) {
                throw new BusinessException(
                    'CANNOT_CANCEL_WITHIN_4_HOURS',
                    'Đã quá thời hạn hủy vé (hạn chót là 4 giờ trước khi sự kiện bắt đầu).',
                    null,
                    409
                );
            }

            // Step 7: Update ticket to DaHuy
            $lockedTicket->trang_thai = 'DaHuy';
            $lockedTicket->thoi_gian_huy = now();
            $lockedTicket->ly_do_huy = $reason;
            $lockedTicket->save();

            // Step 8: Drain Window & Capacity Invariant Accounting
            // so_luong_toi_da = valid_tickets + OFFERED + so_slot_dong_bang + so_ve_con_lai
            if (! $suKien->khong_gioi_han_slot) {
                $this->waitlistService->offerNext((int) $suKien->ma_su_kien, now());
            }

            // Step 9: Audit Log (CANCEL_TICKET)
            $this->auditLogService->logAudit(
                'CANCEL_TICKET',
                $suKien->ma_su_kien,
                $lockedTicket->ma_dang_ky,
                $user->ma_tai_khoan,
                'DaDangKy',
                'DaHuy',
                $reason,
                $user->ma_tai_khoan
            );

            // Step 10: In-app notification to the cancelling student
            $this->notificationService->sendNotification(
                $user->ma_tai_khoan,
                'Hủy vé tham dự thành công',
                "Bạn đã hủy vé tham dự sự kiện '{$suKien->ten_su_kien}'.",
                'HE_THONG',
                '/my-tickets'
            );

            return $lockedTicket->fresh(['suKien.phongHoiTruong', 'chungNhan']);
        });

        $response = [
            'ticket' => $cancelledTicket,
        ];

        // Cache idempotent response for 5 minutes (300 seconds)
        // Thay đoạn ghi cache (khoảng dòng 183-189)
        if ($cacheKey) {
            Cache::put($cacheKey, [
                'payload_hash' => md5($reason),
                'ma_dang_ky' => $cancelledTicket->ma_dang_ky,
            ], 300);
        }

        return $response;
    }
}
