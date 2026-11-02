<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Models\DatPhong;
use App\Models\DonViToChuc;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\ThongBao;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class EventApprovalService
{
    private const UNIT_ADMIN_PCTSV = 7;

    private const EMERGENCY_PERMISSION = 'emergency_override';

    private const OVERRIDE_WAIT_HOURS = 48;

    private const MIN_REASON_LENGTH = 10;

    private const MAX_REASON_LENGTH = 1000;

    /**
     * Host B duyệt sự kiện:
     * PENDING_FACULTY -> PENDING_ADMIN.
     */
    public function approveFaculty(User $actor, int $eventId): SuKien
    {
        return DB::transaction(function () use ($actor, $eventId) {
            $lockedActor = $this->lockActor($actor);
            $this->ensureActiveOrganization($lockedActor);

            $event = SuKien::query()
                ->where('ma_su_kien', $eventId)
                ->lockForUpdate()
                ->first();

            $this->ensureEventExists($event);

            $this->ensureEventStatus($event, 'PENDING_FACULTY');

            $facultyId = $this->getFacultyId($event);

            if ((int) $lockedActor->ma_don_vi_to_chuc !== (int) $facultyId) {
                throw new BusinessException(
                    'FACULTY_MISMATCH',
                    'Bạn không đại diện cho Khoa quản lý sự kiện này.',
                    null,
                    403
                );
            }

            $previousStatus = $event->trang_thai;

            $event->update([
                'trang_thai' => 'PENDING_ADMIN',
            ]);

            app(ApprovalAuditService::class)->log(
                action: 'APPROVE_FACULTY',
                eventId: (int) $event->ma_su_kien,
                previousStatus: $previousStatus,
                nextStatus: 'PENDING_ADMIN',
                reason: null,
                actorUserId: (int) $lockedActor->ma_tai_khoan
            );

            $this->notifyAdmins(
                'Yêu cầu duyệt sự kiện',
                "Sự kiện \"{$event->ten_su_kien}\" đã được Khoa duyệt và đang chờ P.CTSV duyệt cuối."
            );

            return $event->fresh();
        });
    }

    /**
     * Admin P.CTSV duyệt thay Host B:
     * PENDING_FACULTY -> PENDING_ADMIN.
     *
     * Quy tắc bổ sung:
     * - Đủ 48 giờ: Admin được override.
     * - Chưa đủ 48 giờ: cần quyền emergency_override.
     * - Không có tài khoản Host B đang hoạt động: được override ngay.
     */
    public function adminOverride(
        User $actor,
        int $eventId,
        array $data
    ): SuKien {
        $reason = $this->validateReason($data['ly_do'] ?? null);
        $isEmergency = (bool) ($data['duyet_khan_cap'] ?? false);

        return DB::transaction(function () use ($actor, $eventId, $reason, $isEmergency) {
            $lockedActor = $this->lockActor($actor);
            $this->ensureAdminPCTSV($lockedActor);

            $event = SuKien::query()
                ->where('ma_su_kien', $eventId)
                ->lockForUpdate()
                ->first();

            $this->ensureEventExists($event);

            $this->ensureEventStatus($event, 'PENDING_FACULTY');

            $facultyId = $this->getFacultyId($event);

            $hasActiveFacultyAccount = User::query()
                ->where('loai_tai_khoan', 'ToChuc')
                ->where('ma_don_vi_to_chuc', $facultyId)
                ->where('hoat_dong', 1)
                ->exists();

            if ($hasActiveFacultyAccount) {
                $submittedAt = $event->thoi_gian_gui_khoa;

                if (! $submittedAt) {
                    throw new BusinessException(
                        'MISSING_FACULTY_SUBMISSION_TIME',
                        'Không xác định được thời điểm gửi Khoa duyệt.',
                        null,
                        409
                    );
                }

                $deadline = $submittedAt->copy()
                    ->addHours(self::OVERRIDE_WAIT_HOURS);

                $waitingPeriodPassed = now()->greaterThanOrEqualTo($deadline);

                if (! $waitingPeriodPassed) {
                    if (! $isEmergency) {
                        throw new BusinessException(
                            'OVERRIDE_WAIT_PERIOD_NOT_PASSED',
                            'Chưa đủ 48 giờ kể từ khi gửi Khoa duyệt. Cần quyền duyệt khẩn cấp để tiếp tục.',
                            [
                                'thoi_gian_gui_khoa' => $submittedAt->toIso8601String(),
                                'thoi_diem_duoc_override' => $deadline->toIso8601String(),
                            ],
                            409
                        );
                    }

                    if (! $lockedActor->hasPermission(self::EMERGENCY_PERMISSION)) {
                        throw new BusinessException(
                            'EMERGENCY_OVERRIDE_PERMISSION_REQUIRED',
                            'Bạn không có quyền duyệt khẩn cấp.',
                            null,
                            403
                        );
                    }
                }
            }

            if ($isEmergency && ! $lockedActor->hasPermission(self::EMERGENCY_PERMISSION)) {
                throw new BusinessException(
                    'EMERGENCY_OVERRIDE_PERMISSION_REQUIRED',
                    'Bạn không có quyền duyệt khẩn cấp.',
                    null,
                    403
                );
            }

            $auditReason = $isEmergency
                ? '[DUYỆT KHẨN CẤP] ' . $reason
                : $reason;

            $previousStatus = $event->trang_thai;

            $event->update([
                'trang_thai' => 'PENDING_ADMIN',
            ]);

            app(ApprovalAuditService::class)->log(
                action: 'APPROVE_FACULTY_BY_ADMIN',
                eventId: (int) $event->ma_su_kien,
                previousStatus: $previousStatus,
                nextStatus: 'PENDING_ADMIN',
                reason: $auditReason,
                actorUserId: (int) $lockedActor->ma_tai_khoan
            );

            $this->notifyAdmins(
                'Yêu cầu duyệt sự kiện',
                "Sự kiện \"{$event->ten_su_kien}\" đã được Admin duyệt thay cấp Khoa và đang chờ duyệt cuối."
            );

            $this->notifyUnitMembers(
                (int) $event->ma_don_vi_to_chuc,
                'KET_QUA_KIEM_DUYET',
                "Sự kiện \"{$event->ten_su_kien}\" đã được Admin duyệt thay cấp Khoa và đang chờ P.CTSV duyệt cuối."
            );

            return $event->fresh();
        });
    }

    /**
     * Admin P.CTSV duyệt cuối:
     * PENDING_ADMIN -> APPROVED.
     *
     * Booking PENDING -> CONFIRMED.
     */
    public function approveAdmin(User $actor, int $eventId): SuKien
    {
        return DB::transaction(function () use ($actor, $eventId) {
            $lockedActor = $this->lockActor($actor);
            $this->ensureAdminPCTSV($lockedActor);

            // Đọc snapshot để xác định phòng cần khóa.
            $eventSnapshot = SuKien::query()->find($eventId);

            $this->ensureEventExists($eventSnapshot);

            /*
             * Thứ tự khóa:
             * tai_khoan -> phong_hoi_truong -> dat_phong -> su_kien.
             */

            $room = PhongHoiTruong::query()
                ->where('ma_phong', $eventSnapshot->ma_phong)
                ->where('da_xoa', 0)
                ->lockForUpdate()
                ->first();

            if (! $room) {
                throw new BusinessException(
                    'ROOM_NOT_FOUND',
                    'Không tìm thấy phòng của sự kiện.',
                    null,
                    404
                );
            }

            $booking = DatPhong::query()
                ->where('ma_su_kien', $eventId)
                ->where('trang_thai', 'PENDING')
                ->lockForUpdate()
                ->first();

            if (! $booking) {
                throw new BusinessException(
                    'BOOKING_NOT_FOUND',
                    'Không tìm thấy yêu cầu đặt phòng đang chờ xác nhận.',
                    null,
                    409
                );
            }

            $event = SuKien::query()
                ->where('ma_su_kien', $eventId)
                ->lockForUpdate()
                ->first();

            $this->ensureEventExists($event);
            $this->ensureEventStatus($event, 'PENDING_ADMIN');

            // Đảm bảo phòng không bị thay đổi giữa lúc đọc snapshot và khóa.
            if ((int) $event->ma_phong !== (int) $room->ma_phong) {
                throw new BusinessException(
                    'EVENT_ROOM_CHANGED',
                    'Phòng của sự kiện đã thay đổi. Vui lòng tải lại thông tin và thử lại.',
                    null,
                    409
                );
            }

            if ($room->trang_thai !== 'KhaDung') {
                throw new BusinessException(
                    'ROOM_UNAVAILABLE',
                    'Phòng hiện không khả dụng.',
                    null,
                    409
                );
            }

            $start = $booking->thoi_gian_bat_dau;
            $end = $booking->thoi_gian_ket_thuc;

            if (! $start || ! $end) {
                throw new BusinessException(
                    'INVALID_BOOKING_TIME',
                    'Thời gian đặt phòng không hợp lệ.',
                    null,
                    422
                );
            }

            if (
                $event->so_luong_toi_da !== null
                && (int) $room->suc_chua_toi_da < (int) $event->so_luong_toi_da
            ) {
                throw new BusinessException(
                    'ROOM_CAPACITY_INSUFFICIENT',
                    'Sức chứa phòng không đáp ứng số lượng người tham gia tối đa.',
                    [
                        'suc_chua_phong' => $room->suc_chua_toi_da,
                        'so_luong_toi_da' => $event->so_luong_toi_da,
                    ],
                    409
                );
            }

            // Kiểm tra thời gian bảo trì.
            if (
                $room->bao_tri_tu_ngay
                && $room->bao_tri_den_ngay
                && $start < $room->bao_tri_den_ngay
                && $end > $room->bao_tri_tu_ngay
            ) {
                throw new BusinessException(
                    'ROOM_MAINTENANCE_CONFLICT',
                    'Phòng đang có lịch bảo trì trùng với thời gian sự kiện.',
                    null,
                    409
                );
            }

            // Kiểm tra lịch đặt phòng khác, áp dụng khoảng đệm 15 phút.
            $bufferedStart = $start->copy()->subMinutes(15);
            $bufferedEnd = $end->copy()->addMinutes(15);

            $hasConflict = DatPhong::query()
                ->where('ma_phong', $room->ma_phong)
                ->where('ma_dat_phong', '!=', $booking->ma_dat_phong)
                ->where(function ($query) use ($bufferedStart, $bufferedEnd) {
                    $query
                        ->where(function ($confirmed) use ($bufferedStart, $bufferedEnd) {
                            $confirmed
                                ->where('trang_thai', 'CONFIRMED')
                                ->where('thoi_gian_bat_dau', '<', $bufferedEnd)
                                ->where('thoi_gian_ket_thuc', '>', $bufferedStart);
                        })
                        ->orWhere(function ($pending) use ($bufferedStart, $bufferedEnd) {
                            $pending
                                ->where('trang_thai', 'PENDING')
                                ->where('han_giu_cho_tam', '>', now())
                                ->where('thoi_gian_bat_dau', '<', $bufferedEnd)
                                ->where('thoi_gian_ket_thuc', '>', $bufferedStart);
                        });
                })
                ->exists();

            if ($hasConflict) {
                throw new BusinessException(
                    'ROOM_SCHEDULE_CONFLICT',
                    'Phòng có lịch đặt khác trùng hoặc nằm trong khoảng đệm 15 phút.',
                    null,
                    409
                );
            }

            $previousStatus = $event->trang_thai;

            $booking->update([
                'trang_thai' => 'CONFIRMED',
                'han_giu_cho_tam' => null,
            ]);

            $event->update([
                'trang_thai' => 'APPROVED',
            ]);

            app(ApprovalAuditService::class)->log(
                action: 'APPROVE_ADMIN',
                eventId: (int) $event->ma_su_kien,
                previousStatus: $previousStatus,
                nextStatus: 'APPROVED',
                reason: null,
                actorUserId: (int) $lockedActor->ma_tai_khoan
            );

            $this->notifyUnitMembers(
                (int) $event->ma_don_vi_to_chuc,
                'KET_QUA_KIEM_DUYET',
                "Sự kiện \"{$event->ten_su_kien}\" đã được P.CTSV phê duyệt."
            );

            return $event->fresh();
        });
    }

    /**
     * Host B từ chối:
     * PENDING_FACULTY -> REJECTED_FACULTY.
     *
     * Booking PENDING -> CANCELLED.
     */
    public function rejectFaculty(
        User $actor,
        int $eventId,
        array $data
    ): SuKien {
        $reason = $this->validateReason($data['ly_do'] ?? null);

        return DB::transaction(function () use ($actor, $eventId, $reason) {
            $lockedActor = $this->lockActor($actor);
            $this->ensureActiveOrganization($lockedActor);

            $event = SuKien::query()->find($eventId);

            $this->ensureEventExists($event);

            $facultyId = $this->getFacultyId($event);

            if ((int) $lockedActor->ma_don_vi_to_chuc !== (int) $facultyId) {
                throw new BusinessException(
                    'FACULTY_MISMATCH',
                    'Bạn không đại diện cho Khoa quản lý sự kiện này.',
                    null,
                    403
                );
            }

            $booking = DatPhong::query()
                ->where('ma_su_kien', $eventId)
                ->where('trang_thai', 'PENDING')
                ->lockForUpdate()
                ->first();

            $event = SuKien::query()
                ->where('ma_su_kien', $eventId)
                ->lockForUpdate()
                ->first();

            $this->ensureEventExists($event);
            $this->ensureEventStatus($event, 'PENDING_FACULTY');

            if (! $booking) {
                throw new BusinessException(
                    'BOOKING_NOT_FOUND',
                    'Không tìm thấy yêu cầu đặt phòng đang chờ xác nhận.',
                    null,
                    409
                );
            }

            $previousStatus = $event->trang_thai;

            $booking->update([
                'trang_thai' => 'CANCELLED',
                'han_giu_cho_tam' => null,
            ]);

            $event->update([
                'trang_thai' => 'REJECTED_FACULTY',
            ]);

            app(ApprovalAuditService::class)->log(
                action: 'REJECT_FACULTY',
                eventId: (int) $event->ma_su_kien,
                previousStatus: $previousStatus,
                nextStatus: 'REJECTED_FACULTY',
                reason: $reason,
                actorUserId: (int) $lockedActor->ma_tai_khoan
            );

            $this->notifyUnitMembers(
                (int) $event->ma_don_vi_to_chuc,
                'KET_QUA_KIEM_DUYET',
                "Sự kiện \"{$event->ten_su_kien}\" đã bị Khoa từ chối. Lý do: {$reason}"
            );

            return $event->fresh();
        });
    }

    /**
     * Admin P.CTSV từ chối:
     * PENDING_ADMIN -> REJECTED_ADMIN.
     *
     * Booking PENDING -> CANCELLED.
     */
    public function rejectAdmin(
        User $actor,
        int $eventId,
        array $data
    ): SuKien {
        $reason = $this->validateReason($data['ly_do'] ?? null);

        return DB::transaction(function () use ($actor, $eventId, $reason) {
            $lockedActor = $this->lockActor($actor);
            $this->ensureAdminPCTSV($lockedActor);

            $event = SuKien::query()->find($eventId);

            $this->ensureEventExists($event);

            $booking = DatPhong::query()
                ->where('ma_su_kien', $eventId)
                ->where('trang_thai', 'PENDING')
                ->lockForUpdate()
                ->first();

            $event = SuKien::query()
                ->where('ma_su_kien', $eventId)
                ->lockForUpdate()
                ->first();

            $this->ensureEventExists($event);
            $this->ensureEventStatus($event, 'PENDING_ADMIN');

            if (! $booking) {
                throw new BusinessException(
                    'BOOKING_NOT_FOUND',
                    'Không tìm thấy yêu cầu đặt phòng đang chờ xác nhận.',
                    null,
                    409
                );
            }

            $previousStatus = $event->trang_thai;

            $booking->update([
                'trang_thai' => 'CANCELLED',
                'han_giu_cho_tam' => null,
            ]);

            $event->update([
                'trang_thai' => 'REJECTED_ADMIN',
            ]);

            app(ApprovalAuditService::class)->log(
                action: 'REJECT_ADMIN',
                eventId: (int) $event->ma_su_kien,
                previousStatus: $previousStatus,
                nextStatus: 'REJECTED_ADMIN',
                reason: $reason,
                actorUserId: (int) $lockedActor->ma_tai_khoan
            );

            $this->notifyUnitMembers(
                (int) $event->ma_don_vi_to_chuc,
                'KET_QUA_KIEM_DUYET',
                "Sự kiện \"{$event->ten_su_kien}\" đã bị P.CTSV từ chối. Lý do: {$reason}"
            );

            return $event->fresh();
        });
    }

    /**
     * Khóa và đọc lại tài khoản thao tác.
     *
     * Việc này giúp đồng bộ với thao tác cấp/thu hồi quyền khẩn cấp,
     * vì EmergencyOverrideService cũng khóa bản ghi tài khoản mục tiêu.
     */
    private function lockActor(User $actor): User
    {
        $lockedActor = User::query()
            ->where('ma_tai_khoan', $actor->ma_tai_khoan)
            ->lockForUpdate()
            ->first();

        if (! $lockedActor || ! $lockedActor->hoat_dong) {
            throw new BusinessException(
                'ACCOUNT_INACTIVE',
                'Tài khoản không tồn tại hoặc đã bị khóa.',
                null,
                403
            );
        }

        return $lockedActor;
    }

    /**
     * Chỉ cho phép tài khoản ToChuc đang hoạt động.
     */
    private function ensureActiveOrganization(User $actor): void
    {
        if (! $actor->isToChuc() || ! $actor->ma_don_vi_to_chuc) {
            throw new BusinessException(
                'FORBIDDEN',
                'Chỉ tài khoản đơn vị tổ chức đang hoạt động mới được thực hiện thao tác này.',
                null,
                403
            );
        }
    }

    /**
     * Xác định Khoa quản lý đơn vị chủ trì.
     */
    private function getFacultyId(SuKien $event): int
    {
        $hostUnit = DonViToChuc::query()
            ->find($event->ma_don_vi_to_chuc);

        if (! $hostUnit) {
            throw new BusinessException(
                'HOST_UNIT_NOT_FOUND',
                'Không tìm thấy đơn vị chủ trì sự kiện.',
                null,
                404
            );
        }

        $facultyId = $hostUnit->loai_don_vi === 'Khoa'
            ? $hostUnit->ma_don_vi_to_chuc
            : $hostUnit->ma_don_vi_cha;

        if (! $facultyId) {
            throw new BusinessException(
                'FACULTY_NOT_FOUND',
                'Không xác định được Khoa quản lý sự kiện.',
                null,
                409
            );
        }

        return (int) $facultyId;
    }

    /**
     * Chỉ Admin thuộc P.CTSV mới được duyệt cuối hoặc override.
     */
    private function ensureAdminPCTSV(User $actor): void
    {
        if (
            ! $actor->isAdmin()
            || ! $actor->hoat_dong
            || (int) $actor->ma_don_vi_to_chuc !== self::UNIT_ADMIN_PCTSV
        ) {
            throw new BusinessException(
                'FORBIDDEN',
                'Chỉ Admin thuộc Phòng Công tác Sinh viên mới được thực hiện thao tác này.',
                null,
                403
            );
        }
    }

    /**
     * Kiểm tra sự kiện tồn tại.
     */
    private function ensureEventExists(?SuKien $event): void
    {
        if (! $event) {
            throw new BusinessException(
                'EVENT_NOT_FOUND',
                'Không tìm thấy sự kiện.',
                null,
                404
            );
        }
    }

    /**
     * Kiểm tra trạng thái hiện tại của sự kiện.
     */
    private function ensureEventStatus(SuKien $event, string $expectedStatus): void
    {
        if ($event->trang_thai !== $expectedStatus) {
            throw new BusinessException(
                'INVALID_EVENT_STATUS',
                'Sự kiện không ở trạng thái phù hợp để thực hiện thao tác.',
                [
                    'trang_thai_hien_tai' => $event->trang_thai,
                    'trang_thai_yeu_cau' => $expectedStatus,
                ],
                409
            );
        }
    }

    /**
     * Kiểm tra lý do override hoặc từ chối.
     */
    private function validateReason(mixed $reason): string
    {
        $reason = trim((string) $reason);

        $length = mb_strlen($reason);

        if (
            $length < self::MIN_REASON_LENGTH
            || $length > self::MAX_REASON_LENGTH
        ) {
            throw new BusinessException(
                'INVALID_REASON',
                'Lý do phải có từ 10 đến 1000 ký tự.',
                null,
                422
            );
        }

        return $reason;
    }

    /**
     * Gửi thông báo đến thành viên đang hoạt động của một đơn vị.
     */
    private function notifyUnitMembers(
        int $unitId,
        string $type,
        string $message
    ): void {
        $userIds = User::query()
            ->where('ma_don_vi_to_chuc', $unitId)
            ->where('hoat_dong', 1)
            ->pluck('ma_tai_khoan');

        foreach ($userIds as $userId) {
            ThongBao::create([
                'ma_tai_khoan' => $userId,
                'tieu_de' => 'Thông báo Sự kiện',
                'noi_dung' => $message,
                'loai_thong_bao' => $type,
            ]);
        }
    }

    /**
     * Gửi thông báo đến Admin P.CTSV.
     */
    private function notifyAdmins(string $title, string $message): void
    {
        $adminIds = User::query()
            ->where('loai_tai_khoan', 'Admin')
            ->where('ma_don_vi_to_chuc', self::UNIT_ADMIN_PCTSV)
            ->where('hoat_dong', 1)
            ->pluck('ma_tai_khoan');

        foreach ($adminIds as $adminId) {
            ThongBao::create([
                'ma_tai_khoan' => $adminId,
                'tieu_de' => $title,
                'noi_dung' => $message,
                'loai_thong_bao' => 'DE_XUAT_SU_KIEN',
            ]);
        }
    }
}
