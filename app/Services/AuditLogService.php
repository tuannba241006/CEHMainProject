<?php

namespace App\Services;

use App\Models\NhatKyKiemDuyet;
use Illuminate\Support\Facades\Auth;
use InvalidArgumentException;

class AuditLogService
{
    /**
     * Actions that require a non-empty reason by DB constraint chk_kiemduyet_lydo.
     */
    protected const ACTIONS_REQUIRING_REASON = [
        'WITHDRAW_PROPOSAL',
        'COHOST_REJECT',
        'APPROVE_FACULTY_BY_ADMIN',
        'REJECT_FACULTY',
        'REJECT_ADMIN',
        'REQUEST_EDIT',
        'CHANGE_ROOM',
        'EARLY_CHECKOUT_CONFIRM',
        'AUTO_OPEN_CHECKOUT',
        'CANCEL_EVENT',
        'CANCEL_TICKET',
        'GRANT_FEEDBACK_GRACE',
        'REVOKE_CERTIFICATE',
        'UNLOCK_DRL',
        'LOCK_ACCOUNT',
    ];

    /**
     * Actions that strictly require reason length >= 10 characters.
     */
    protected const ACTIONS_REQUIRING_MIN_10_CHARS = [
        'REJECT_FACULTY',
        'REJECT_ADMIN',
    ];

    /**
     * Log an immutable audit entry to nhat_ky_kiem_duyet.
     */
    public function logAudit(
        string $action,
        ?int $eventId = null,
        ?int $regId = null,
        ?int $targetUserId = null,
        ?string $prevStatus = null,
        ?string $nextStatus = null,
        ?string $reason = null,
        ?int $actorUserId = null
    ): NhatKyKiemDuyet {
        // 1. Verify that at least one target is specified (chk_kiemduyet_doituong)
        if ($eventId === null && $regId === null && $targetUserId === null) {
            throw new InvalidArgumentException(
                'Nhật ký kiểm duyệt bắt buộc phải gắn với ít nhất một đối tượng mục tiêu (Sự kiện, Vé đăng ký, hoặc Tài khoản).'
            );
        }

        // 2. Validate reason constraints (chk_kiemduyet_lydo)
        $trimmedReason = $reason !== null ? trim($reason) : '';

        if (in_array($action, self::ACTIONS_REQUIRING_REASON, true) && $trimmedReason === '') {
            throw new InvalidArgumentException("Hành động '{$action}' bắt buộc phải cung cấp lý do.");
        }

        if (in_array($action, self::ACTIONS_REQUIRING_MIN_10_CHARS, true) && mb_strlen($trimmedReason) < 10) {
            throw new InvalidArgumentException("Hành động '{$action}' bắt buộc phải cung cấp lý do tối thiểu 10 ký tự.");
        }

        // 3. Determine actor: explicit actor ID, or current authenticated user, or null (system background worker)
        $actor = $actorUserId ?? Auth::id();

        // 4. Create immutable audit record
        return NhatKyKiemDuyet::create([
            'ma_su_kien' => $eventId,
            'ma_dang_ky' => $regId,
            'ma_tai_khoan_muc_tieu' => $targetUserId,
            'nguoi_thuc_hien' => $actor,
            'hanh_dong' => $action,
            'trang_thai_truoc' => $prevStatus,
            'trang_thai_sau' => $nextStatus,
            'ly_do' => $trimmedReason !== '' ? $trimmedReason : null,
        ]);
    }
}
