<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Models\DatPhong;
use App\Models\DonViToChuc;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\ThongBao;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class EventApprovalService
{
    /**
     * Lấy ID của đơn vị P.CTSV (tra cứu động theo mã định danh hoặc config).
     */
    public function getPctsvUnitId(): int
    {
        $configId = config('ceh.units.pctsv');
        if ($configId !== null) {
            return (int) $configId;
        }

        $unitId = DonViToChuc::query()
            ->where('ma_dinh_danh', 'PCTSV')
            ->value('ma_don_vi_to_chuc');

        if ($unitId === null) {
            throw new BusinessException(
                'PCTSV_UNIT_NOT_CONFIGURED',
                'Đơn vị P.CTSV chưa được cấu hình.',
                null,
                500
            );
        }

        return (int) $unitId;
    }

    /**
     * Hàng đợi sự kiện chờ phê duyệt dành cho Cấp Khoa & P.CTSV (GET /events/review-queue).
     */
    public function getReviewQueue(User $actor, array $filters = []): LengthAwarePaginator
    {
        $query = SuKien::query();

        if ($actor->isToChuc() && ! $actor->isAdmin()) {
            $unit = $actor->donViToChuc;
            if (! $unit || $unit->loai_don_vi !== 'Khoa' || $unit->ma_don_vi_cha !== null) {
                throw new BusinessException(
                    'FORBIDDEN',
                    'Chỉ cán bộ Khoa (Faculty Reviewer) hoặc Admin mới có quyền truy cập hàng đợi duyệt.',
                    null,
                    403
                );
            }

            $facultyId = (int) $actor->ma_don_vi_to_chuc;
            $subUnitIds = DonViToChuc::query()
                ->where('ma_don_vi_cha', $facultyId)
                ->orWhere('ma_don_vi_to_chuc', $facultyId)
                ->pluck('ma_don_vi_to_chuc')
                ->all();

            $status = $filters['trang_thai'] ?? 'PENDING_FACULTY';
            $query->where('trang_thai', $status)
                ->whereIn('ma_don_vi_to_chuc', $subUnitIds);
        } elseif ($actor->isAdmin()) {
            if (! empty($filters['trang_thai'])) {
                $query->where('trang_thai', $filters['trang_thai']);
            } else {
                $query->whereIn('trang_thai', ['PENDING_ADMIN', 'PENDING_FACULTY']);
            }
        } else {
            throw new BusinessException(
                'FORBIDDEN',
                'Bạn không có quyền truy cập hàng đợi duyệt sự kiện.',
                null,
                403
            );
        }

        if (! empty($filters['ma_don_vi_to_chuc'])) {
            $query->where('ma_don_vi_to_chuc', (int) $filters['ma_don_vi_to_chuc']);
        }

        $limit = min(100, max(1, (int) ($filters['limit'] ?? 20)));

        return $query->with([
            'dongToChucs.donViToChuc',
            'phongHoiTruong',
            'chuyenDe',
            'donViHost',
            'donViToChuc',
        ])
            ->orderBy('thoi_gian_tao', 'asc')
            ->paginate($limit);
    }

    /**
     * Thẩm định phê duyệt sự kiện Đa cấp qua POST /events/{id}/review.
     */
    public function review(User $actor, int $eventId, array $data): SuKien
    {
        $action = $data['hanh_dong'] ?? '';

        return match ($action) {
            'APPROVE_FACULTY' => $this->approveFaculty($actor, $eventId, $data['ly_do'] ?? null),
            'APPROVE_ADMIN' => $this->approveAdmin($actor, $eventId, $data['ly_do'] ?? null),
            'APPROVE_FACULTY_BY_ADMIN' => $this->adminOverride($actor, $eventId, $data),
            'REJECT_FACULTY' => $this->rejectFaculty($actor, $eventId, $data),
            'REJECT_ADMIN' => $this->rejectAdmin($actor, $eventId, $data),
            'REQUEST_EDIT' => $this->requestEdit($actor, $eventId, $data),
            default => throw new BusinessException(
                'INVALID_ACTION',
                'Hành động kiểm duyệt không hợp lệ.',
                null,
                422
            ),
        };
    }

    /**
     * Host B (Khoa) duyệt sự kiện: PENDING_FACULTY -> PENDING_ADMIN.
     */
    public function approveFaculty(User $actor, int $eventId, ?string $reason = null): SuKien
    {
        return DB::transaction(function () use ($actor, $eventId, $reason) {
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
                reason: $reason ? trim($reason) : null,
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
     * Admin P.CTSV duyệt thay Host B: PENDING_FACULTY -> PENDING_ADMIN hoặc APPROVED.
     */
    public function adminOverride(User $actor, int $eventId, array $data): SuKien
    {
        $reason = $this->validateReason($data['ly_do'] ?? null, 5);
        $duyetLuonCapPhong = (bool) ($data['duyet_luon_cap_phong'] ?? false);

        return DB::transaction(function () use ($actor, $eventId, $reason, $duyetLuonCapPhong) {
            $lockedActor = $this->lockActor($actor);
            $this->ensureAdminPCTSV($lockedActor);

            $eventSnapshot = SuKien::query()->find($eventId);
            $this->ensureEventExists($eventSnapshot);

            if ($duyetLuonCapPhong) {
                // Khóa: phong_hoi_truong -> dat_phong -> su_kien
                $room = PhongHoiTruong::query()
                    ->where('ma_phong', $eventSnapshot->ma_phong)
                    ->where('da_xoa', 0)
                    ->lockForUpdate()
                    ->first();

                if (! $room) {
                    throw new BusinessException('ROOM_NOT_FOUND', 'Không tìm thấy phòng của sự kiện.', null, 404);
                }

                $booking = DatPhong::query()
                    ->where('ma_su_kien', $eventId)
                    ->where('trang_thai', 'PENDING')
                    ->lockForUpdate()
                    ->first();

                if (! $booking) {
                    throw new BusinessException('BOOKING_NOT_FOUND', 'Không tìm thấy yêu cầu đặt phòng đang chờ xác nhận.', null, 409);
                }

                $event = SuKien::query()
                    ->where('ma_su_kien', $eventId)
                    ->lockForUpdate()
                    ->first();

                $this->ensureEventExists($event);
                $this->ensureEventStatus($event, 'PENDING_FACULTY');

                $this->verifyRoomAvailabilityForApproval($room, $booking, $event);

                $previousStatus = $event->trang_thai;

                $booking->update([
                    'trang_thai' => 'CONFIRMED',
                    'han_giu_cho_tam' => null,
                ]);

                $event->update([
                    'trang_thai' => 'APPROVED',
                ]);

                app(ApprovalAuditService::class)->log(
                    action: 'APPROVE_FACULTY_BY_ADMIN',
                    eventId: (int) $event->ma_su_kien,
                    previousStatus: $previousStatus,
                    nextStatus: 'APPROVED',
                    reason: $reason,
                    actorUserId: (int) $lockedActor->ma_tai_khoan
                );

                $this->notifyUnitMembers(
                    (int) $event->ma_don_vi_to_chuc,
                    'KET_QUA_KIEM_DUYET',
                    "Sự kiện \"{$event->ten_su_kien}\" đã được Admin duyệt thay cấp Khoa và cấp phòng thành công."
                );

                return $event->fresh();
            }

            // Nếu không duyệt luôn cấp phòng: chuyển sang PENDING_ADMIN
            $event = SuKien::query()
                ->where('ma_su_kien', $eventId)
                ->lockForUpdate()
                ->first();

            $this->ensureEventExists($event);
            $this->ensureEventStatus($event, 'PENDING_FACULTY');

            $previousStatus = $event->trang_thai;

            $event->update([
                'trang_thai' => 'PENDING_ADMIN',
            ]);

            app(ApprovalAuditService::class)->log(
                action: 'APPROVE_FACULTY_BY_ADMIN',
                eventId: (int) $event->ma_su_kien,
                previousStatus: $previousStatus,
                nextStatus: 'PENDING_ADMIN',
                reason: $reason,
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
     * Admin P.CTSV duyệt cuối: PENDING_ADMIN -> APPROVED.
     */
    public function approveAdmin(User $actor, int $eventId, ?string $reason = null): SuKien
    {
        return DB::transaction(function () use ($actor, $eventId, $reason) {
            $lockedActor = $this->lockActor($actor);
            $this->ensureAdminPCTSV($lockedActor);

            $eventSnapshot = SuKien::query()->find($eventId);
            $this->ensureEventExists($eventSnapshot);

            $room = PhongHoiTruong::query()
                ->where('ma_phong', $eventSnapshot->ma_phong)
                ->where('da_xoa', 0)
                ->lockForUpdate()
                ->first();

            if (! $room) {
                throw new BusinessException('ROOM_NOT_FOUND', 'Không tìm thấy phòng của sự kiện.', null, 404);
            }

            $booking = DatPhong::query()
                ->where('ma_su_kien', $eventId)
                ->where('trang_thai', 'PENDING')
                ->lockForUpdate()
                ->first();

            if (! $booking) {
                throw new BusinessException('BOOKING_NOT_FOUND', 'Không tìm thấy yêu cầu đặt phòng đang chờ xác nhận.', null, 409);
            }

            $event = SuKien::query()
                ->where('ma_su_kien', $eventId)
                ->lockForUpdate()
                ->first();

            $this->ensureEventExists($event);
            $this->ensureEventStatus($event, 'PENDING_ADMIN');

            $this->verifyRoomAvailabilityForApproval($room, $booking, $event);

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
                reason: $reason ? trim($reason) : null,
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
     * Khoa từ chối sự kiện: PENDING_FACULTY -> REJECTED.
     */
    public function rejectFaculty(User $actor, int $eventId, array $data): SuKien
    {
        $reason = $this->validateReason($data['ly_do'] ?? null, 10);

        return DB::transaction(function () use ($actor, $eventId, $reason) {
            $lockedActor = $this->lockActor($actor);
            $this->ensureActiveOrganization($lockedActor);

            $event = SuKien::query()->find($eventId);
            $this->ensureEventExists($event);

            $facultyId = $this->getFacultyId($event);

            if ((int) $lockedActor->ma_don_vi_to_chuc !== (int) $facultyId) {
                throw new BusinessException('FACULTY_MISMATCH', 'Bạn không đại diện cho Khoa quản lý sự kiện này.', null, 403);
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

            $previousStatus = $event->trang_thai;

            if ($booking) {
                $booking->update([
                    'trang_thai' => 'CANCELLED',
                    'han_giu_cho_tam' => null,
                ]);
            }

            $event->update([
                'trang_thai' => 'REJECTED',
            ]);

            app(ApprovalAuditService::class)->log(
                action: 'REJECT_FACULTY',
                eventId: (int) $event->ma_su_kien,
                previousStatus: $previousStatus,
                nextStatus: 'REJECTED',
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
     * P.CTSV từ chối sự kiện: PENDING_ADMIN -> REJECTED.
     */
    public function rejectAdmin(User $actor, int $eventId, array $data): SuKien
    {
        $reason = $this->validateReason($data['ly_do'] ?? null, 10);

        return DB::transaction(function () use ($actor, $eventId, $reason) {
            $lockedActor = $this->lockActor($actor);
            $this->ensureAdminPCTSV($lockedActor);

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

            $previousStatus = $event->trang_thai;

            if ($booking) {
                $booking->update([
                    'trang_thai' => 'CANCELLED',
                    'han_giu_cho_tam' => null,
                ]);
            }

            $event->update([
                'trang_thai' => 'REJECTED',
            ]);

            app(ApprovalAuditService::class)->log(
                action: 'REJECT_ADMIN',
                eventId: (int) $event->ma_su_kien,
                previousStatus: $previousStatus,
                nextStatus: 'REJECTED',
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
     * Yêu cầu chỉnh sửa đề xuất sự kiện: PENDING_... -> DRAFT (UC-EVT-03.AC.3).
     */
    public function requestEdit(User $actor, int $eventId, array $data): SuKien
    {
        $reason = $this->validateReason($data['ly_do'] ?? null, 5);

        return DB::transaction(function () use ($actor, $eventId, $reason) {
            $lockedActor = $this->lockActor($actor);

            $event = SuKien::query()
                ->where('ma_su_kien', $eventId)
                ->lockForUpdate()
                ->first();

            $this->ensureEventExists($event);

            if ($lockedActor->isToChuc() && ! $lockedActor->isAdmin()) {
                $this->ensureActiveOrganization($lockedActor);
                if ($event->trang_thai !== 'PENDING_FACULTY') {
                    throw new BusinessException(
                        'INVALID_STATE_TRANSITION',
                        'Đại diện Khoa chỉ được yêu cầu chỉnh sửa sự kiện đang ở trạng thái PENDING_FACULTY.',
                        null,
                        409
                    );
                }

                $facultyId = $this->getFacultyId($event);
                if ((int) $lockedActor->ma_don_vi_to_chuc !== (int) $facultyId) {
                    throw new BusinessException('FACULTY_MISMATCH', 'Bạn không đại diện cho Khoa quản lý sự kiện này.', null, 403);
                }
            } elseif ($lockedActor->isAdmin()) {
                $this->ensureAdminPCTSV($lockedActor);
                if (! in_array($event->trang_thai, ['PENDING_ADMIN', 'PENDING_FACULTY'], true)) {
                    throw new BusinessException(
                        'INVALID_STATE_TRANSITION',
                        'Chỉ có thể yêu cầu chỉnh sửa sự kiện đang chờ duyệt (PENDING_ADMIN hoặc PENDING_FACULTY).',
                        null,
                        409
                    );
                }
            } else {
                throw new BusinessException('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', null, 403);
            }

            $booking = DatPhong::query()
                ->where('ma_su_kien', $eventId)
                ->where('trang_thai', 'PENDING')
                ->lockForUpdate()
                ->first();

            if ($booking) {
                $booking->update([
                    'trang_thai' => 'CANCELLED',
                    'han_giu_cho_tam' => null,
                ]);
            }

            $previousStatus = $event->trang_thai;

            $event->update([
                'trang_thai' => 'DRAFT',
            ]);

            app(ApprovalAuditService::class)->log(
                action: 'REQUEST_EDIT',
                eventId: (int) $event->ma_su_kien,
                previousStatus: $previousStatus,
                nextStatus: 'DRAFT',
                reason: $reason,
                actorUserId: (int) $lockedActor->ma_tai_khoan
            );

            $this->notifyUnitMembers(
                (int) $event->ma_don_vi_to_chuc,
                'KET_QUA_KIEM_DUYET',
                "Sự kiện \"{$event->ten_su_kien}\" được yêu cầu chỉnh sửa. Góp ý: {$reason}"
            );

            return $event->fresh();
        });
    }

    /**
     * Tái mở sự kiện bị từ chối đưa về DRAFT (POST /events/{id}/reopen).
     */
    public function reopen(User $actor, int $eventId): SuKien
    {
        return DB::transaction(function () use ($actor, $eventId) {
            $lockedActor = $this->lockActor($actor);

            $event = SuKien::query()
                ->where('ma_su_kien', $eventId)
                ->lockForUpdate()
                ->first();

            $this->ensureEventExists($event);

            if (! in_array($event->trang_thai, ['REJECTED', 'COHOST_REJECTED'], true)) {
                throw new BusinessException(
                    'INVALID_STATE_TRANSITION',
                    'Sự kiện không ở trạng thái REJECTED hoặc COHOST_REJECTED.',
                    null,
                    409
                );
            }

            if (! $lockedActor->isAdmin()) {
                $this->ensureActiveOrganization($lockedActor);
                if ((int) $lockedActor->ma_don_vi_to_chuc !== (int) $event->ma_don_vi_to_chuc) {
                    throw new BusinessException(
                        'FORBIDDEN',
                        'Chỉ đơn vị chủ trì (Host A) hoặc Admin mới có quyền tái mở sự kiện.',
                        null,
                        403
                    );
                }
            }

            $event->update([
                'trang_thai' => 'DRAFT',
            ]);

            return $event->fresh();
        });
    }

    /**
     * Kiểm tra khả dụng phòng khi Admin chốt duyệt.
     */
    private function verifyRoomAvailabilityForApproval(PhongHoiTruong $room, DatPhong $booking, SuKien $event): void
    {
        if ((int) $event->ma_phong !== (int) $room->ma_phong) {
            throw new BusinessException('EVENT_ROOM_CHANGED', 'Phòng của sự kiện đã thay đổi. Vui lòng tải lại và thử lại.', null, 409);
        }

        if ($room->trang_thai !== 'KhaDung') {
            throw new BusinessException('ROOM_UNAVAILABLE', 'Phòng hiện không khả dụng.', null, 409);
        }

        $start = $booking->thoi_gian_bat_dau;
        $end = $booking->thoi_gian_ket_thuc;

        if (! $start || ! $end) {
            throw new BusinessException('INVALID_BOOKING_TIME', 'Thời gian đặt phòng không hợp lệ.', null, 422);
        }

        if ($event->so_luong_toi_da !== null && (int) $room->suc_chua_toi_da < (int) $event->so_luong_toi_da) {
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

        if ($room->bao_tri_tu_ngay && $room->bao_tri_den_ngay && $start < $room->bao_tri_den_ngay && $end > $room->bao_tri_tu_ngay) {
            throw new BusinessException('ROOM_MAINTENANCE_CONFLICT', 'Phòng đang có lịch bảo trì trùng với thời gian sự kiện.', null, 409);
        }

        $bufferedStart = $start->copy()->subMinutes(15);
        $bufferedEnd = $end->copy()->addMinutes(15);

        $hasConflict = DatPhong::query()
            ->where('ma_phong', $room->ma_phong)
            ->where('ma_dat_phong', '!=', $booking->ma_dat_phong)
            ->where(function ($query) use ($bufferedStart, $bufferedEnd) {
                $query->where(function ($confirmed) use ($bufferedStart, $bufferedEnd) {
                    $confirmed->where('trang_thai', 'CONFIRMED')
                        ->where('thoi_gian_bat_dau', '<', $bufferedEnd)
                        ->where('thoi_gian_ket_thuc', '>', $bufferedStart);
                })->orWhere(function ($pending) use ($bufferedStart, $bufferedEnd) {
                    $pending->where('trang_thai', 'PENDING')
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
    }

    private function lockActor(User $actor): User
    {
        $lockedActor = User::query()
            ->where('ma_tai_khoan', $actor->ma_tai_khoan)
            ->lockForUpdate()
            ->first();

        if (! $lockedActor || ! $lockedActor->hoat_dong) {
            throw new BusinessException('ACCOUNT_INACTIVE', 'Tài khoản không tồn tại hoặc đã bị khóa.', null, 403);
        }

        return $lockedActor;
    }

    private function ensureActiveOrganization(User $actor): void
    {
        if (! $actor->isToChuc() || ! $actor->ma_don_vi_to_chuc) {
            throw new BusinessException('FORBIDDEN', 'Chỉ tài khoản đơn vị tổ chức đang hoạt động mới được thực hiện thao tác này.', null, 403);
        }
    }

    private function getFacultyId(SuKien $event): int
    {
        $hostUnit = DonViToChuc::query()->find($event->ma_don_vi_to_chuc);

        if (! $hostUnit) {
            throw new BusinessException('HOST_UNIT_NOT_FOUND', 'Không tìm thấy đơn vị chủ trì sự kiện.', null, 404);
        }

        $facultyId = $hostUnit->loai_don_vi === 'Khoa'
            ? $hostUnit->ma_don_vi_to_chuc
            : $hostUnit->ma_don_vi_cha;

        if (! $facultyId) {
            throw new BusinessException('FACULTY_NOT_FOUND', 'Không xác định được Khoa quản lý sự kiện.', null, 409);
        }

        return (int) $facultyId;
    }

    private function ensureAdminPCTSV(User $actor): void
    {
        if (
            ! $actor->isAdmin()
            || ! $actor->hoat_dong
            || (int) $actor->ma_don_vi_to_chuc !== $this->getPctsvUnitId()
        ) {
            throw new BusinessException('FORBIDDEN', 'Chỉ Admin thuộc Phòng Công tác Sinh viên mới được thực hiện thao tác này.', null, 403);
        }
    }

    private function ensureEventExists(?SuKien $event): void
    {
        if (! $event) {
            throw new BusinessException('EVENT_NOT_FOUND', 'Không tìm thấy sự kiện.', null, 404);
        }
    }

    private function ensureEventStatus(SuKien $event, string $expectedStatus): void
    {
        if ($event->trang_thai !== $expectedStatus) {
            throw new BusinessException(
                'INVALID_STATE_TRANSITION',
                "Trạng thái hiện tại ({$event->trang_thai}) không hợp lệ để thực hiện thao tác. Yêu cầu trạng thái: {$expectedStatus}.",
                null,
                409
            );
        }
    }

    private function validateReason(mixed $reason, int $minLength = 10, int $maxLength = 1000): string
    {
        $reason = trim((string) $reason);
        $length = mb_strlen($reason);

        if ($length < $minLength || $length > $maxLength) {
            throw new BusinessException(
                'INVALID_REASON',
                "Lý do phải có từ {$minLength} đến {$maxLength} ký tự.",
                null,
                422
            );
        }

        return $reason;
    }

    private function notifyUnitMembers(int $unitId, string $type, string $message): void
    {
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

    private function notifyAdmins(string $title, string $message): void
    {
        $adminIds = User::query()
            ->where('loai_tai_khoan', 'Admin')
            ->where('ma_don_vi_to_chuc', $this->getPctsvUnitId())
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
