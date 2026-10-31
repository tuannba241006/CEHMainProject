<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Models\DatPhong;
use App\Models\DonViToChuc;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\SuKienDongToChuc;
use App\Models\ThongBao;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class EventProposalService
{
    public function __construct(
        protected AuditLogService $auditLogService,
        protected RoomScheduleService $roomScheduleService
    ) {}

    /**
     * Gửi đề xuất phê duyệt sự kiện (Soft Hold 48h & Host-driven Routing - UC-EVT-02).
     *
     * Khóa dòng theo đúng thứ tự phân cấp toàn cục:
     *   phong_hoi_truong -> dat_phong -> su_kien
     */
    public function submitApproval(User $user, int $eventId): SuKien
    {
        $event = SuKien::find($eventId);
        if (! $event) {
            throw new BusinessException('NOT_FOUND', 'Tài nguyên yêu cầu không tồn tại trong hệ thống.', null, 404);
        }

        // 1. Phân quyền: Chỉ Host A hoặc Admin
        if (! $user->isAdmin() && (int) $event->ma_don_vi_to_chuc !== (int) $user->ma_don_vi_to_chuc) {
            throw new BusinessException('FORBIDDEN', 'Bạn không có quyền gửi đề xuất sự kiện này.', null, 403);
        }

        // 2. Kiểm tra trạng thái: Chỉ gửi duyệt khi DRAFT
        if ($event->trang_thai !== 'DRAFT') {
            throw new BusinessException(
                'INVALID_STATE_TRANSITION',
                'Chỉ sự kiện ở trạng thái DRAFT mới có thể gửi phê duyệt.',
                null,
                409
            );
        }

        return DB::transaction(function () use ($user, $event) {
            // Bước 2.1: Khóa dòng phòng hội trường (phong_hoi_truong)
            $room = PhongHoiTruong::where('ma_phong', $event->ma_phong)->lockForUpdate()->firstOrFail();

            // Kiểm tra lại bất biến sức chứa tại thời điểm gửi duyệt
            if ((int) $event->khong_gioi_han_slot === 0 && (int) $event->so_luong_toi_da > $room->suc_chua_toi_da) {
                throw new BusinessException(
                    'CAPACITY_EXCEEDS_ROOM',
                    'Số lượng vé tối đa vượt quá sức chứa hiện tại của phòng.',
                    null,
                    409
                );
            }

            // Kiểm tra lại xung đột phòng thời gian thực (đệm 15 phút) qua RoomScheduleService
            $start = Carbon::parse($event->thoi_gian_bat_dau);
            $end = Carbon::parse($event->thoi_gian_ket_thuc);
            $availability = $this->roomScheduleService->checkAvailability(
                $room->ma_phong,
                $start,
                $end,
                $event->ma_su_kien,
                $user
            );

            if (! $availability['success'] || ! $availability['data']['available']) {
                if (! empty($availability['data']['maintenance_conflict'])) {
                    throw new BusinessException(
                        'ROOM_MAINTENANCE_CONFLICT',
                        'Phòng hội trường đang trong lịch bảo trì tại khung giờ này.',
                        $availability['data']['maintenance_conflict'],
                        409
                    );
                }

                $conflictDetails = $availability['data']['conflicts'] ?? [];
                $firstConflict = $conflictDetails[0] ?? null;

                throw new BusinessException(
                    'ROOM_CONFLICT',
                    'Phòng hội trường đã có sự kiện khác đặt trong khung giờ này (bao gồm đệm an toàn 15 phút).',
                    [
                        'su_kien_trung' => $firstConflict ? [
                            'ma_su_kien' => $firstConflict['ma_su_kien'] ?? null,
                            'ten_su_kien' => $firstConflict['ten_su_kien'] ?? '',
                            'thoi_gian_bat_dau' => $firstConflict['thoi_gian_bat_dau'] ?? null,
                            'thoi_gian_ket_thuc' => $firstConflict['thoi_gian_ket_thuc'] ?? null,
                            'ten_phong' => $room->ten_phong,
                        ] : null,
                    ],
                    409
                );
            }

            // Bước 2.2: Khóa dòng đặt phòng (dat_phong)
            $datPhong = DatPhong::where('ma_su_kien', $event->ma_su_kien)
                ->where('trang_thai', 'PENDING')
                ->lockForUpdate()
                ->first();

            // Bước 2.3: Khóa dòng sự kiện (su_kien)
            $eventLocked = SuKien::where('ma_su_kien', $event->ma_su_kien)->lockForUpdate()->firstOrFail();
            if ($eventLocked->trang_thai !== 'DRAFT') {
                throw new BusinessException(
                    'INVALID_STATE_TRANSITION',
                    'Chỉ sự kiện ở trạng thái DRAFT mới có thể gửi phê duyệt.',
                    null,
                    409
                );
            }

            // Đặt lại toàn bộ lời mời đồng tổ chức về CHO_XAC_NHAN
            SuKienDongToChuc::where('ma_su_kien', $event->ma_su_kien)->update([
                'trang_thai_xac_nhan' => 'CHO_XAC_NHAN',
                'thoi_gian_phan_hoi' => null,
                'ghi_chu_tu_choi' => null,
            ]);

            $cohostCount = SuKienDongToChuc::where('ma_su_kien', $event->ma_su_kien)->count();
            $hasCohosts = ($cohostCount > 0);

            // Xử lý giữ chỗ Soft Hold
            $hanGiuChoTam = $hasCohosts ? now()->addHours(48) : null;

            if ($datPhong) {
                $datPhong->update([
                    'ma_phong' => $event->ma_phong,
                    'thoi_gian_bat_dau' => $event->thoi_gian_bat_dau,
                    'thoi_gian_ket_thuc' => $event->thoi_gian_ket_thuc,
                    'trang_thai' => 'PENDING',
                    'han_giu_cho_tam' => $hanGiuChoTam,
                ]);
            } else {
                DatPhong::create([
                    'ma_phong' => $event->ma_phong,
                    'ma_su_kien' => $event->ma_su_kien,
                    'thoi_gian_bat_dau' => $event->thoi_gian_bat_dau,
                    'thoi_gian_ket_thuc' => $event->thoi_gian_ket_thuc,
                    'trang_thai' => 'PENDING',
                    'han_giu_cho_tam' => $hanGiuChoTam,
                ]);
            }

            // Phân nhánh luồng duyệt (Host-driven Routing)
            $prevStatus = $eventLocked->trang_thai;
            if ($hasCohosts) {
                $nextStatus = 'WAITING_COHOST_CONFIRM';
                $this->notifyCohosts($eventLocked);
            } else {
                $hostUnit = DonViToChuc::find($eventLocked->ma_don_vi_to_chuc);
                if ($hostUnit && $hostUnit->ma_don_vi_cha !== null) {
                    $nextStatus = 'PENDING_FACULTY';
                    $this->notifyUnitMembers($hostUnit->ma_don_vi_cha, 'DE_XUAT_SU_KIEN', "Đề xuất sự kiện mới chờ Khoa duyệt: {$eventLocked->ten_su_kien}");
                } else {
                    $nextStatus = 'PENDING_ADMIN';
                    $this->notifyAdmins('DE_XUAT_SU_KIEN', "Đề xuất sự kiện mới chờ P.CTSV duyệt: {$eventLocked->ten_su_kien}");
                }
            }

            $eventLocked->trang_thai = $nextStatus;
            $eventLocked->save();

            // Ghi nhật ký kiểm toán bất biến
            $this->auditLogService->logAudit(
                action: 'SUBMIT',
                eventId: $eventLocked->ma_su_kien,
                prevStatus: $prevStatus,
                nextStatus: $nextStatus,
                actorUserId: $user->ma_tai_khoan
            );

            return $eventLocked->fresh([
                'chuyenDe',
                'donViHost',
                'phongHoiTruong',
                'dongToChucs.donViToChuc',
                'datPhongs',
                'nhatKyKiemDuyets',
            ]);
        });
    }

    /**
     * Phản hồi lời mời đồng tổ chức (DONG_Y hoặc TU_CHOI - UC-EVT-02.AC.1, AC.2).
     *
     * Khóa dòng theo đúng thứ tự phân cấp con:
     *   dat_phong -> su_kien
     */
    public function respondInvitation(User $user, int $eventId, string $action, ?string $ghiChu = null): SuKien
    {
        $event = SuKien::find($eventId);
        if (! $event) {
            throw new BusinessException('NOT_FOUND', 'Tài nguyên yêu cầu không tồn tại trong hệ thống.', null, 404);
        }

        // Xác định đơn vị của người dùng
        $userUnitId = $user->ma_don_vi_to_chuc;
        if (! $userUnitId && ! $user->isAdmin()) {
            throw new BusinessException('FORBIDDEN', 'Tài khoản chưa được gán đơn vị tổ chức.', null, 403);
        }

        // Tìm lời mời tương ứng
        $invitation = SuKienDongToChuc::where('ma_su_kien', $eventId)
            ->when(! $user->isAdmin(), fn ($q) => $q->where('ma_don_vi_to_chuc', $userUnitId))
            ->first();

        if (! $invitation) {
            throw new BusinessException('FORBIDDEN', 'Bạn không thuộc đơn vị đồng tổ chức của sự kiện này.', null, 403);
        }

        if ($event->trang_thai !== 'WAITING_COHOST_CONFIRM' || $invitation->trang_thai_xac_nhan !== 'CHO_XAC_NHAN') {
            throw new BusinessException(
                'INVALID_STATE_TRANSITION',
                'Sự kiện không còn ở trạng thái chờ đồng tổ chức xác nhận (WAITING_COHOST_CONFIRM).',
                null,
                409
            );
        }

        return DB::transaction(function () use ($user, $eventId, $invitation, $action, $ghiChu) {
            // Bước 1: Khóa dat_phong
            $datPhong = DatPhong::where('ma_su_kien', $eventId)
                ->where('trang_thai', 'PENDING')
                ->lockForUpdate()
                ->first();

            // Bước 2: Khóa su_kien
            $event = SuKien::where('ma_su_kien', $eventId)->lockForUpdate()->firstOrFail();

            if ($event->trang_thai !== 'WAITING_COHOST_CONFIRM') {
                throw new BusinessException(
                    'INVALID_STATE_TRANSITION',
                    'Sự kiện không còn ở trạng thái chờ đồng tổ chức xác nhận (WAITING_COHOST_CONFIRM).',
                    null,
                    409
                );
            }

            // Re-read after locking the event so concurrent responses cannot process a stale invitation.
            $invitation = SuKienDongToChuc::where('id', $invitation->id)->firstOrFail();
            if ($invitation->trang_thai_xac_nhan !== 'CHO_XAC_NHAN') {
                throw new BusinessException(
                    'INVALID_STATE_TRANSITION',
                    'Đơn vị đồng tổ chức đã phản hồi lời mời trước đó.',
                    null,
                    409
                );
            }

            $prevStatus = $event->trang_thai;

            if ($action === 'TU_CHOI') {
                $trimmedNote = trim((string) $ghiChu);

                // Cập nhật lời mời
                $invitation->update([
                    'trang_thai_xac_nhan' => 'TU_CHOI',
                    'thoi_gian_phan_hoi' => now(),
                    'ghi_chu_tu_choi' => $trimmedNote,
                ]);

                // Hủy giữ chỗ phòng
                if ($datPhong) {
                    $datPhong->update(['trang_thai' => 'CANCELLED']);
                }

                // Chuyển sự kiện sang COHOST_REJECTED
                $event->trang_thai = 'COHOST_REJECTED';
                $event->save();

                // Ghi nhật ký kiểm duyệt
                $this->auditLogService->logAudit(
                    action: 'COHOST_REJECT',
                    eventId: $event->ma_su_kien,
                    prevStatus: $prevStatus,
                    nextStatus: 'COHOST_REJECTED',
                    reason: $trimmedNote,
                    actorUserId: $user->ma_tai_khoan
                );

                // Thông báo cho Host A
                $this->notifyUnitMembers(
                    $event->ma_don_vi_to_chuc,
                    'PHAN_HOI_DONG_TO_CHUC',
                    "Đơn vị {$invitation->donViToChuc?->ten_don_vi} đã từ chối tham gia đồng tổ chức sự kiện: {$event->ten_su_kien}"
                );
            } else {
                // Hành động DONG_Y
                $invitation->update([
                    'trang_thai_xac_nhan' => 'DONG_Y',
                    'thoi_gian_phan_hoi' => now(),
                ]);

                // Ghi audit log chấp thuận
                $this->auditLogService->logAudit(
                    action: 'COHOST_ACCEPT',
                    eventId: $event->ma_su_kien,
                    prevStatus: $prevStatus,
                    nextStatus: $prevStatus,
                    actorUserId: $user->ma_tai_khoan
                );

                // Kiểm tra xem 100% các đơn vị đã DONG_Y chưa
                $unconfirmedCount = SuKienDongToChuc::where('ma_su_kien', $eventId)
                    ->where('trang_thai_xac_nhan', '!=', 'DONG_Y')
                    ->count();

                if ($unconfirmedCount === 0) {
                    // Đạt 100% đồng thuận: Xóa hạn giữ chỗ tạm thời (han_giu_cho_tam = null)
                    if ($datPhong) {
                        $datPhong->update(['han_giu_cho_tam' => null]);
                    }

                    // Chuyển tiếp lên cấp phê duyệt kế tiếp
                    $hostUnit = DonViToChuc::find($event->ma_don_vi_to_chuc);
                    if ($hostUnit && $hostUnit->ma_don_vi_cha !== null) {
                        $nextStatus = 'PENDING_FACULTY';
                        $this->notifyUnitMembers($hostUnit->ma_don_vi_cha, 'DE_XUAT_SU_KIEN', "100% đồng tổ chức đã đồng ý. Đề xuất sự kiện chờ Khoa duyệt: {$event->ten_su_kien}");
                    } else {
                        $nextStatus = 'PENDING_ADMIN';
                        $this->notifyAdmins('DE_XUAT_SU_KIEN', "100% đồng tổ chức đã đồng ý. Đề xuất sự kiện chờ P.CTSV duyệt: {$event->ten_su_kien}");
                    }

                    $event->trang_thai = $nextStatus;
                    $event->save();
                }
            }

            return $event->fresh([
                'chuyenDe',
                'donViHost',
                'phongHoiTruong',
                'dongToChucs.donViToChuc',
                'datPhongs',
                'nhatKyKiemDuyets',
            ]);
        });
    }

    /**
     * Rút đề xuất sự kiện về DRAFT (UC-EVT-02.AC.3).
     *
     * Khóa dòng theo đúng thứ tự phân cấp con:
     *   dat_phong -> su_kien
     */
    public function withdrawProposal(User $user, int $eventId, string $lyDoRut): SuKien
    {
        $event = SuKien::find($eventId);
        if (! $event) {
            throw new BusinessException('NOT_FOUND', 'Tài nguyên yêu cầu không tồn tại trong hệ thống.', null, 404);
        }

        // Phân quyền: Host A hoặc Admin
        if (! $user->isAdmin() && (int) $event->ma_don_vi_to_chuc !== (int) $user->ma_don_vi_to_chuc) {
            throw new BusinessException('FORBIDDEN', 'Bạn không có quyền rút đề xuất sự kiện này.', null, 403);
        }

        // Trạng thái hợp lệ để rút
        $allowedStates = ['WAITING_COHOST_CONFIRM', 'PENDING_FACULTY', 'PENDING_ADMIN'];
        if (! in_array($event->trang_thai, $allowedStates, true)) {
            throw new BusinessException(
                'INVALID_STATE_TRANSITION',
                'Chỉ được rút đề xuất khi sự kiện đang ở WAITING_COHOST_CONFIRM, PENDING_FACULTY hoặc PENDING_ADMIN.',
                null,
                409
            );
        }

        return DB::transaction(function () use ($user, $eventId, $lyDoRut) {
            // Bước 1: Khóa dat_phong
            $datPhong = DatPhong::where('ma_su_kien', $eventId)
                ->where('trang_thai', 'PENDING')
                ->lockForUpdate()
                ->first();

            // Bước 2: Khóa su_kien
            $event = SuKien::where('ma_su_kien', $eventId)->lockForUpdate()->firstOrFail();

            $allowedStates = ['WAITING_COHOST_CONFIRM', 'PENDING_FACULTY', 'PENDING_ADMIN'];
            if (! in_array($event->trang_thai, $allowedStates, true)) {
                throw new BusinessException(
                    'INVALID_STATE_TRANSITION',
                    'Chỉ được rút đề xuất khi sự kiện đang ở WAITING_COHOST_CONFIRM, PENDING_FACULTY hoặc PENDING_ADMIN.',
                    null,
                    409
                );
            }

            $prevStatus = $event->trang_thai;

            // Giải phóng phòng
            if ($datPhong) {
                $datPhong->update(['trang_thai' => 'CANCELLED']);
            }

            // Chuyển sự kiện về DRAFT
            $event->trang_thai = 'DRAFT';
            $event->save();

            // Ghi nhật ký kiểm toán
            $this->auditLogService->logAudit(
                action: 'WITHDRAW_PROPOSAL',
                eventId: $event->ma_su_kien,
                prevStatus: $prevStatus,
                nextStatus: 'DRAFT',
                reason: trim($lyDoRut),
                actorUserId: $user->ma_tai_khoan
            );

            return $event->fresh([
                'chuyenDe',
                'donViHost',
                'phongHoiTruong',
                'dongToChucs.donViToChuc',
                'datPhongs',
                'nhatKyKiemDuyets',
            ]);
        });
    }

    /**
     * Danh sách lời mời đồng tổ chức gửi đến đơn vị hiện tại (UC-EVT-02.AC.1).
     */
    public function listInvitations(User $user, array $filters): LengthAwarePaginator
    {
        $query = SuKienDongToChuc::query()
            ->with([
                'suKien.donViHost',
                'suKien.phongHoiTruong',
                'suKien.datPhongs',
                'donViToChuc',
            ]);

        // Lọc theo đơn vị
        if (! $user->isAdmin()) {
            $userUnitId = $user->ma_don_vi_to_chuc;
            if (! $userUnitId) {
                return $query->whereRaw('1 = 0')->paginate(1);
            }
            $query->where('ma_don_vi_to_chuc', $userUnitId);
        } else {
            if (isset($filters['ma_don_vi_to_chuc'])) {
                $query->where('ma_don_vi_to_chuc', $filters['ma_don_vi_to_chuc']);
            }
        }

        // Lọc theo trạng thái xác nhận (Mặc định CHO_XAC_NHAN)
        $status = $filters['trang_thai_xac_nhan'] ?? 'CHO_XAC_NHAN';
        if (! empty($status)) {
            $query->where('trang_thai_xac_nhan', $status);
        }

        $query->orderBy('id', 'desc');

        $limit = max(1, min(100, (int) ($filters['limit'] ?? 20)));
        $page = max(1, (int) ($filters['page'] ?? 1));

        return $query->paginate($limit, ['*'], 'page', $page);
    }

    /**
     * Gửi thông báo mời đồng tổ chức.
     */
    protected function notifyCohosts(SuKien $event): void
    {
        $cohosts = SuKienDongToChuc::where('ma_su_kien', $event->ma_su_kien)->get();
        foreach ($cohosts as $cohost) {
            $this->notifyUnitMembers(
                $cohost->ma_don_vi_to_chuc,
                'MOI_DONG_TO_CHUC',
                "Lời mời phối hợp đồng tổ chức sự kiện: {$event->ten_su_kien}"
            );
        }
    }

    /**
     * Gửi thông báo cho thành viên trong một đơn vị.
     */
    protected function notifyUnitMembers(int $unitId, string $type, string $message): void
    {
        $userIds = User::where('ma_don_vi_to_chuc', $unitId)
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
     * Gửi thông báo cho quản trị viên (Admin / P.CTSV).
     */
    protected function notifyAdmins(string $type, string $message): void
    {
        $adminIds = User::where('loai_tai_khoan', 'Admin')
            ->where('hoat_dong', 1)
            ->pluck('ma_tai_khoan');

        foreach ($adminIds as $adminId) {
            ThongBao::create([
                'ma_tai_khoan' => $adminId,
                'tieu_de' => 'Hệ thống Quản lý Sự kiện',
                'noi_dung' => $message,
                'loai_thong_bao' => $type,
            ]);
        }
    }
}
