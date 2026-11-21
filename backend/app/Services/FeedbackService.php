<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Models\DangKy;
use App\Models\DanhGiaFeedback;
use App\Models\SuKien;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FeedbackService
{
    public function __construct(
        protected AuditLogService $auditLogService
    ) {}

    /**
     * Submit event feedback within 48h or grace window (UC-FEED-01, FR-24).
     */
    public function submitFeedback(int $eventId, int $userId, array $data): DangKy
    {
        $event = SuKien::findOrFail($eventId);

        if ($event->trang_thai !== 'COMPLETED') {
            throw new BusinessException(
                'NOT_ELIGIBLE',
                'Sự kiện chưa kết thúc, không thể thực hiện khảo sát đánh giá.',
                null,
                409
            );
        }

        $ticket = DangKy::with('suKien.phongHoiTruong', 'suKien.donViToChuc')
            ->where('ma_su_kien', $eventId)
            ->where('ma_tai_khoan', $userId)
            ->first();

        if (! $ticket) {
            throw new BusinessException(
                'FORBIDDEN',
                'Bạn không có vé tham dự sự kiện này.',
                null,
                403
            );
        }

        if (! $ticket->da_check_out || $ticket->trang_thai !== 'DaCheckOut' || (float) $ticket->ti_le_drl <= 0) {
            throw new BusinessException(
                'NOT_ELIGIBLE',
                'Bạn chưa hoàn thành điểm danh Check-out hoặc không đủ điều kiện tham gia khảo sát.',
                null,
                403
            );
        }

        if ($ticket->da_feedback || DanhGiaFeedback::where('ma_dang_ky', $ticket->ma_dang_ky)->where('ma_su_kien', $eventId)->exists()) {
            throw new BusinessException(
                'FEEDBACK_ALREADY_SUBMITTED',
                'Bạn đã hoàn thành khảo sát đánh giá cho sự kiện này trước đó.',
                null,
                409
            );
        }

        $endTime = Carbon::parse($event->thoi_gian_ket_thuc);
        $normalDeadline = $endTime->copy()->addHours(48);
        $graceDeadline = $ticket->han_an_han_feedback ? Carbon::parse($ticket->han_an_han_feedback) : null;
        $effectiveDeadline = ($graceDeadline && $graceDeadline->gt($normalDeadline)) ? $graceDeadline : $normalDeadline;

        if (now()->gt($effectiveDeadline)) {
            throw new BusinessException(
                'FEEDBACK_WINDOW_CLOSED',
                'Đã hết thời hạn 48 giờ làm khảo sát đánh giá sự kiện.',
                null,
                409
            );
        }

        DB::transaction(function () use ($ticket, $eventId, $data) {
            DanhGiaFeedback::create([
                'ma_dang_ky' => $ticket->ma_dang_ky,
                'ma_su_kien' => $eventId,
                'diem_noi_dung' => $data['diem_noi_dung'],
                'diem_dien_gia' => $data['diem_dien_gia'],
                'diem_to_chuc' => $data['diem_to_chuc'],
                'y_kien_dong_gop' => $data['y_kien_dong_gop'] ?? null,
                'thoi_gian_gui' => now(),
            ]);

            $ticket->update([
                'da_feedback' => true,
                'du_dieu_kien_drl' => true,
            ]);
        });

        return $ticket->fresh(['suKien.phongHoiTruong', 'suKien.donViToChuc', 'taiKhoan']);
    }

    /**
     * Admin grants 24h feedback grace period for a specific student ticket (UC-FEED-01.AC.1).
     */
    public function grantGrace(int $ticketId, string $reason, ?int $adminId = null): DangKy
    {
        $ticket = DangKy::with('suKien', 'taiKhoan')->findOrFail($ticketId);

        if ($ticket->suKien?->da_chot_drl) {
            throw new BusinessException(
                'DRL_LOCKED',
                'Vui lòng mở khóa danh sách ĐRL của sự kiện trước khi cấp ân hạn Feedback.',
                null,
                409
            );
        }

        if ($ticket->da_feedback) {
            throw new BusinessException(
                'FEEDBACK_ALREADY_SUBMITTED',
                'Sinh viên này đã nộp khảo sát đánh giá nên không cần mở ân hạn.',
                null,
                409
            );
        }

        if (! $ticket->da_check_out || $ticket->trang_thai !== 'DaCheckOut' || (float) $ticket->ti_le_drl <= 0) {
            throw new BusinessException(
                'NOT_ELIGIBLE',
                'Vé chưa hoàn thành Check-out với tỷ lệ ĐRL hợp lệ.',
                null,
                409
            );
        }

        $prevGrace = $ticket->han_an_han_feedback;
        $newGrace = now()->addHours(24);

        DB::transaction(function () use ($ticket, $newGrace, $prevGrace, $reason, $adminId) {
            $ticket->update([
                'han_an_han_feedback' => $newGrace,
            ]);

            $this->auditLogService->logAudit(
                action: 'GRANT_FEEDBACK_GRACE',
                eventId: $ticket->ma_su_kien,
                regId: $ticket->ma_dang_ky,
                targetUserId: $ticket->ma_tai_khoan,
                prevStatus: $prevGrace ? Carbon::parse($prevGrace)->toIso8601String() : null,
                nextStatus: $newGrace->toIso8601String(),
                reason: $reason,
                actorUserId: $adminId
            );
        });

        return $ticket->fresh(['suKien', 'taiKhoan']);
    }
}
