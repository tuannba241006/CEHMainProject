<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Models\TaiKhoanQuyen;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class EmergencyOverrideService
{
    private const PERMISSION = 'emergency_override';

    /**
     * Cấp quyền duyệt khẩn cấp cho một Admin khác.
     */
    public function grantEmergencyOverride(
        User $actor,
        int $targetUserId,
        string $reason
    ): TaiKhoanQuyen {
        $reason = trim($reason);

        $this->validateReason($reason);

        if (! $actor->isAdmin() || ! $actor->hoat_dong) {
            throw new BusinessException(
                'FORBIDDEN',
                'Chỉ Admin đang hoạt động mới được cấp quyền.',
                null,
                403
            );
        }

        if ((int) $actor->ma_tai_khoan === $targetUserId) {
            throw new BusinessException(
                'SELF_PERMISSION_GRANT',
                'Không được tự cấp quyền khẩn cấp cho chính mình.',
                null,
                403
            );
        }

        return DB::transaction(function () use ($actor, $targetUserId, $reason) {
            // Khóa tài khoản nhận quyền để tránh cấp trùng đồng thời.
            $target = User::where('ma_tai_khoan', $targetUserId)
                ->lockForUpdate()
                ->first();

            if (! $target) {
                throw new BusinessException(
                    'NOT_FOUND',
                    'Tài khoản nhận quyền không tồn tại.',
                    null,
                    404
                );
            }

            if (! $target->isAdmin() || ! $target->hoat_dong) {
                throw new BusinessException(
                    'INVALID_PERMISSION_TARGET',
                    'Chỉ được cấp quyền cho tài khoản Admin đang hoạt động.',
                    null,
                    422
                );
            }

            $existingPermission = TaiKhoanQuyen::where(
                'ma_tai_khoan',
                $targetUserId
            )
                ->where('quyen', self::PERMISSION)
                ->whereNull('thoi_gian_thu_hoi')
                ->lockForUpdate()
                ->first();

            if ($existingPermission) {
                throw new BusinessException(
                    'PERMISSION_ALREADY_GRANTED',
                    'Tài khoản này đã có quyền duyệt khẩn cấp.',
                    null,
                    409
                );
            }

            $permission = TaiKhoanQuyen::create([
                'ma_tai_khoan' => $targetUserId,
                'quyen' => self::PERMISSION,
                'nguoi_cap' => $actor->ma_tai_khoan,
                'ly_do_cap' => $reason,
                'thoi_gian_cap' => now(),
            ]);

            $this->auditLogService()->logAudit(
                action: 'GRANT_EMERGENCY_OVERRIDE',
                targetUserId: $targetUserId,
                nextStatus: 'ACTIVE',
                reason: $reason,
                actorUserId: $actor->ma_tai_khoan
            );

            return $permission;
        });
    }

    /**
     * Thu hồi quyền duyệt khẩn cấp.
     */
    public function revokeEmergencyOverride(
        User $actor,
        int $targetUserId,
        string $reason
    ): TaiKhoanQuyen {
        $reason = trim($reason);

        $this->validateReason($reason);

        if (! $actor->isAdmin() || ! $actor->hoat_dong) {
            throw new BusinessException(
                'FORBIDDEN',
                'Chỉ Admin đang hoạt động mới được thu hồi quyền.',
                null,
                403
            );
        }

        if ((int) $actor->ma_tai_khoan === $targetUserId) {
            throw new BusinessException(
                'SELF_PERMISSION_REVOKE',
                'Không được tự thu hồi quyền khẩn cấp của chính mình.',
                null,
                403
            );
        }

        return DB::transaction(function () use ($actor, $targetUserId, $reason) {
            // Dùng cùng thứ tự khóa với thao tác cấp quyền.
            $target = User::where('ma_tai_khoan', $targetUserId)
                ->lockForUpdate()
                ->first();

            if (! $target) {
                throw new BusinessException(
                    'NOT_FOUND',
                    'Tài khoản cần thu hồi quyền không tồn tại.',
                    null,
                    404
                );
            }

            $permission = TaiKhoanQuyen::where(
                'ma_tai_khoan',
                $targetUserId
            )
                ->where('quyen', self::PERMISSION)
                ->whereNull('thoi_gian_thu_hoi')
                ->lockForUpdate()
                ->first();

            if (! $permission) {
                throw new BusinessException(
                    'PERMISSION_NOT_FOUND',
                    'Tài khoản hiện không có quyền duyệt khẩn cấp.',
                    null,
                    404
                );
            }

            $permission->update([
                'nguoi_thu_hoi' => $actor->ma_tai_khoan,
                'ly_do_thu_hoi' => $reason,
                'thoi_gian_thu_hoi' => now(),
            ]);

            $this->auditLogService()->logAudit(
                action: 'REVOKE_EMERGENCY_OVERRIDE',
                targetUserId: $targetUserId,
                prevStatus: 'ACTIVE',
                nextStatus: 'REVOKED',
                reason: $reason,
                actorUserId: $actor->ma_tai_khoan
            );

            return $permission->fresh();
        });
    }

    /**
     * Kiểm tra lý do cấp hoặc thu hồi quyền.
     */
    private function validateReason(string $reason): void
    {
        if (mb_strlen($reason) < 10 || mb_strlen($reason) > 1000) {
            throw new InvalidArgumentException(
                'Lý do cấp hoặc thu hồi quyền phải có từ 10 đến 1000 ký tự.'
            );
        }
    }

    /**
     * Lấy AuditLogService từ container.
     */
    private function auditLogService(): AuditLogService
    {
        return app(AuditLogService::class);
    }
}
