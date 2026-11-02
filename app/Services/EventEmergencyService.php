<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Mail\EventEmergencyMailable;
use App\Models\DangKy;
use App\Models\DatPhong;
use App\Models\HangDoiWaitlist;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\ThongBao;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class EventEmergencyService
{
    /**
     * Hủy sự kiện khẩn cấp khi đang APPROVED hoặc PUBLISHED (UC-EVT-03.AC.5).
     *
     * Tuân thủ thứ tự khóa toàn cục:
     * phong_hoi_truong -> dat_phong -> su_kien -> dang_ky -> hang_doi_waitlist.
     */
    public function emergencyCancel(User $actor, int $eventId, string $reason): SuKien
    {
        $reason = trim($reason);
        if (mb_strlen($reason) < 5 || mb_strlen($reason) > 500) {
            throw new BusinessException(
                'INVALID_REASON',
                'Lý do hủy sự kiện phải có từ 5 đến 500 ký tự.',
                null,
                422
            );
        }

        $emailRecipients = [];

        $eventResult = DB::transaction(function () use ($actor, $eventId, $reason, &$emailRecipients) {
            $lockedActor = $this->lockActor($actor);

            $eventSnapshot = SuKien::query()->find($eventId);
            if (! $eventSnapshot) {
                throw new BusinessException('EVENT_NOT_FOUND', 'Không tìm thấy sự kiện.', null, 404);
            }

            // Kiểm tra trạng thái sự kiện hợp lệ trước khi khóa
            $validStatuses = ['APPROVED', 'PUBLISHED'];
            if (! in_array($eventSnapshot->trang_thai, $validStatuses, true)) {
                throw new BusinessException(
                    'INVALID_STATE_TRANSITION',
                    'Chỉ có thể hủy khẩn cấp khi sự kiện đang ở trạng thái APPROVED hoặc PUBLISHED.',
                    null,
                    409
                );
            }

            // Quyền: ToChuc (Host A) hoặc Admin
            if ($lockedActor->isToChuc() && ! $lockedActor->isAdmin()) {
                if ((int) $lockedActor->ma_don_vi_to_chuc !== (int) $eventSnapshot->ma_don_vi_to_chuc) {
                    throw new BusinessException(
                        'FORBIDDEN',
                        'Chỉ đơn vị chủ trì (Host A) hoặc Quản trị viên mới có quyền hủy sự kiện khẩn cấp.',
                        null,
                        403
                    );
                }
            }

            /*
             * Thứ tự khóa toàn cục:
             * phong_hoi_truong -> dat_phong -> su_kien -> dang_ky -> hang_doi_waitlist
             */
            if ($eventSnapshot->ma_phong) {
                PhongHoiTruong::query()
                    ->where('ma_phong', $eventSnapshot->ma_phong)
                    ->lockForUpdate()
                    ->first();
            }

            $bookings = DatPhong::query()
                ->where('ma_su_kien', $eventId)
                ->lockForUpdate()
                ->get();

            $event = SuKien::query()
                ->where('ma_su_kien', $eventId)
                ->lockForUpdate()
                ->first();

            if (! in_array($event->trang_thai, $validStatuses, true)) {
                throw new BusinessException(
                    'INVALID_STATE_TRANSITION',
                    'Chỉ có thể hủy khẩn cấp khi sự kiện đang ở trạng thái APPROVED hoặc PUBLISHED.',
                    null,
                    409
                );
            }

            $registrations = DangKy::query()
                ->where('ma_su_kien', $eventId)
                ->lockForUpdate()
                ->get();

            $waitlists = HangDoiWaitlist::query()
                ->where('ma_su_kien', $eventId)
                ->lockForUpdate()
                ->get();

            $previousStatus = $event->trang_thai;

            $registrationRecipientIds = $registrations->where('trang_thai', 'DaDangKy')->pluck('ma_tai_khoan')->all();
            $waitlistRecipientIds = $waitlists->whereIn('trang_thai', ['WAITING', 'OFFERED'])->pluck('ma_tai_khoan')->all();

            // 1. Cập nhật sự kiện sang CANCELLED
            $event->update([
                'trang_thai' => 'CANCELLED',
            ]);

            // 2. Hủy toàn bộ giữ phòng
            foreach ($bookings as $booking) {
                $booking->update([
                    'trang_thai' => 'CANCELLED',
                    'han_giu_cho_tam' => null,
                ]);
            }

            // 3. Hủy toàn bộ vé hợp lệ (không tính No-show)
            foreach ($registrations as $reg) {
                if ($reg->trang_thai === 'DaDangKy') {
                    $reg->update([
                        'trang_thai' => 'DaHuy',
                        'thoi_gian_huy' => now(),
                        'ly_do_huy' => 'Sự kiện bị hủy bởi BTC: '.$reason,
                        'vi_pham_no_show' => 0,
                    ]);
                }
            }

            // 4. Đóng hàng đợi Waitlist
            foreach ($waitlists as $w) {
                if (in_array($w->trang_thai, ['WAITING', 'OFFERED'], true)) {
                    $w->update([
                        'trang_thai' => 'CANCELLED',
                        'thoi_gian_phan_hoi' => now(),
                    ]);
                }
            }

            // 5. Ghi Audit Log CANCEL_EVENT
            app(ApprovalAuditService::class)->log(
                action: 'CANCEL_EVENT',
                eventId: $eventId,
                previousStatus: $previousStatus,
                nextStatus: 'CANCELLED',
                reason: $reason,
                actorUserId: (int) $lockedActor->ma_tai_khoan
            );

            // 6. Phát thông báo HUY_SU_KIEN cho toàn bộ người giữ vé và waitlist
            $regUserIds = $registrationRecipientIds;
            $waitlistUserIds = $waitlistRecipientIds;
            $affectedUserIds = array_unique(array_merge($regUserIds, $waitlistUserIds));
            $emailRecipients = User::query()
                ->whereIn('ma_tai_khoan', $affectedUserIds)
                ->whereNotNull('email')
                ->where('email', '<>', '')
                ->get(['email', 'ho_ten']);

            foreach ($affectedUserIds as $uid) {
                ThongBao::create([
                    'ma_tai_khoan' => $uid,
                    'tieu_de' => "Thông báo hủy sự kiện: {$event->ten_su_kien}",
                    'noi_dung' => "Sự kiện \"{$event->ten_su_kien}\" đã bị hủy khẩn cấp. Lý do: {$reason}",
                    'loai_thong_bao' => 'HUY_SU_KIEN',
                ]);
            }

            // Nếu Admin hủy, gửi thông báo cho BTC sự kiện
            if ($lockedActor->isAdmin() && $event->ma_don_vi_to_chuc) {
                $hostMemberIds = User::query()
                    ->where('ma_don_vi_to_chuc', $event->ma_don_vi_to_chuc)
                    ->where('hoat_dong', 1)
                    ->pluck('ma_tai_khoan');

                foreach ($hostMemberIds as $hostUserId) {
                    ThongBao::create([
                        'ma_tai_khoan' => $hostUserId,
                        'tieu_de' => "Thông báo hủy sự kiện: {$event->ten_su_kien}",
                        'noi_dung' => "Sự kiện \"{$event->ten_su_kien}\" đã bị Admin hủy khẩn cấp. Lý do: {$reason}",
                        'loai_thong_bao' => 'HUY_SU_KIEN',
                    ]);
                }
            }

            return $event->fresh();
        });

        $this->queueEmergencyEmails(
            $emailRecipients,
            "[Campus Event Hub] Hủy sự kiện: {$eventResult->ten_su_kien}",
            "Sự kiện {$eventResult->ten_su_kien} đã bị hủy khẩn cấp. Lý do: {$reason}"
        );

        return $eventResult;
    }

    /**
     * Admin điều chuyển phòng khẩn cấp sau khi APPROVED/PUBLISHED (UC-EVT-03.AC.4).
     *
     * Khóa 2 phòng theo thứ tự ma_phong tăng dần để tránh Deadlock:
     * phong_hoi_truong (old & new sorted) -> dat_phong -> su_kien.
     */
    public function changeRoom(User $actor, int $eventId, int $newRoomId, string $reason): SuKien
    {
        $reason = trim($reason);
        if (mb_strlen($reason) < 5 || mb_strlen($reason) > 500) {
            throw new BusinessException(
                'INVALID_REASON',
                'Lý do điều chuyển phòng phải có từ 5 đến 500 ký tự.',
                null,
                422
            );
        }

        $emailRecipients = [];
        $emailRoomChange = '';

        $eventResult = DB::transaction(function () use ($actor, $eventId, $newRoomId, $reason, &$emailRecipients, &$emailRoomChange) {
            $lockedActor = $this->lockActor($actor);

            if (! $lockedActor->isAdmin()) {
                throw new BusinessException(
                    'FORBIDDEN',
                    'Chỉ Quản trị viên (Admin) mới có quyền điều chuyển phòng hội trường.',
                    null,
                    403
                );
            }

            $eventSnapshot = SuKien::query()->find($eventId);
            if (! $eventSnapshot) {
                throw new BusinessException('EVENT_NOT_FOUND', 'Không tìm thấy sự kiện.', null, 404);
            }

            $validStatuses = ['APPROVED', 'PUBLISHED'];
            if (! in_array($eventSnapshot->trang_thai, $validStatuses, true)) {
                throw new BusinessException(
                    'INVALID_STATE_TRANSITION',
                    'Chỉ có thể điều chuyển phòng khi sự kiện đang ở trạng thái APPROVED hoặc PUBLISHED.',
                    null,
                    409
                );
            }

            if ((int) $eventSnapshot->ma_phong === (int) $newRoomId) {
                throw new BusinessException(
                    'ROOM_UNCHANGED',
                    'Phòng mới trùng với phòng hiện tại của sự kiện.',
                    null,
                    409
                );
            }

            /*
             * Thứ tự khóa bắt buộc (Deadlock-Free):
             * Khóa 2 phòng theo ma_phong tăng dần -> dat_phong -> su_kien
             */
            $roomIds = array_filter(array_unique([(int) $eventSnapshot->ma_phong, (int) $newRoomId]));
            sort($roomIds);

            $lockedRooms = PhongHoiTruong::query()
                ->whereIn('ma_phong', $roomIds)
                ->orderBy('ma_phong', 'asc')
                ->lockForUpdate()
                ->get()
                ->keyBy('ma_phong');

            $oldRoom = $lockedRooms->get($eventSnapshot->ma_phong);
            $newRoom = $lockedRooms->get($newRoomId);

            if (! $newRoom || $newRoom->da_xoa) {
                throw new BusinessException('ROOM_NOT_FOUND', 'Không tìm thấy phòng hội trường mới.', null, 404);
            }

            $booking = DatPhong::query()
                ->where('ma_su_kien', $eventId)
                ->whereIn('trang_thai', ['CONFIRMED', 'PENDING'])
                ->lockForUpdate()
                ->first();

            if (! $booking) {
                throw new BusinessException('BOOKING_NOT_FOUND', 'Không tìm thấy thông tin đặt phòng của sự kiện.', null, 409);
            }

            $event = SuKien::query()
                ->where('ma_su_kien', $eventId)
                ->lockForUpdate()
                ->first();

            // 1. Kiểm tra trạng thái phòng mới
            if ($newRoom->trang_thai !== 'KhaDung') {
                throw new BusinessException(
                    'ROOM_UNAVAILABLE',
                    'Phòng mới hiện không khả dụng.',
                    null,
                    409
                );
            }

            // 2. Kiểm tra lịch bảo trì phòng mới
            if (
                $newRoom->bao_tri_tu_ngay
                && $newRoom->bao_tri_den_ngay
                && $event->thoi_gian_bat_dau < $newRoom->bao_tri_den_ngay
                && $event->thoi_gian_ket_thuc > $newRoom->bao_tri_tu_ngay
            ) {
                throw new BusinessException(
                    'ROOM_MAINTENANCE_CONFLICT',
                    'Phòng mới đang có lịch bảo trì trùng với thời gian sự kiện.',
                    null,
                    409
                );
            }

            // 3. Kiểm tra sức chứa phòng mới >= số vé phát hành / đã đăng ký
            $ticketsIssued = DangKy::query()
                ->where('ma_su_kien', $eventId)
                ->where('trang_thai', '!=', 'DaHuy')
                ->count();

            $requiredCapacity = max((int) $event->so_luong_toi_da, $ticketsIssued);

            if ((int) $newRoom->suc_chua_toi_da < $requiredCapacity) {
                throw new BusinessException(
                    'CAPACITY_EXCEEDS_ROOM',
                    "Sức chứa tối đa của phòng mới ({$newRoom->suc_chua_toi_da}) nhỏ hơn số lượng vé phát hành của sự kiện ({$requiredCapacity}).",
                    [
                        'suc_chua_toi_da' => (int) $newRoom->suc_chua_toi_da,
                        'so_luong_toi_da' => $requiredCapacity,
                    ],
                    409
                );
            }

            // 4. Kiểm tra xung đột đệm 15 phút (UC-ROOM-02)
            $bufferedStart = $event->thoi_gian_bat_dau->copy()->subMinutes(15);
            $bufferedEnd = $event->thoi_gian_ket_thuc->copy()->addMinutes(15);

            $conflictingBooking = DatPhong::query()
                ->where('ma_phong', $newRoomId)
                ->where('ma_su_kien', '!=', $eventId)
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
                ->with('suKien:ma_su_kien,ten_su_kien,thoi_gian_bat_dau,thoi_gian_ket_thuc')
                ->first();

            if ($conflictingBooking) {
                $conflictDetails = null;
                if ($conflictingBooking->suKien) {
                    $conflictDetails = [
                        'su_kien_trung' => [
                            'ma_su_kien' => (int) $conflictingBooking->suKien->ma_su_kien,
                            'ten_su_kien' => (string) $conflictingBooking->suKien->ten_su_kien,
                            'thoi_gian_bat_dau' => $conflictingBooking->suKien->thoi_gian_bat_dau?->toIso8601String(),
                            'thoi_gian_ket_thuc' => $conflictingBooking->suKien->thoi_gian_ket_thuc?->toIso8601String(),
                            'ten_phong' => (string) $newRoom->ten_phong,
                        ],
                    ];
                }

                throw new BusinessException(
                    'ROOM_CONFLICT',
                    'Phòng mới được chọn đã có lịch sử dụng trong khung giờ của sự kiện (tính cả đệm 15 phút).',
                    $conflictDetails,
                    409
                );
            }

            // 5. Cập nhật phòng cho sự kiện và đặt phòng
            $oldRoomName = $oldRoom ? $oldRoom->ten_phong : "Phòng ID {$event->ma_phong}";
            $emailRoomChange = "Sự kiện {$event->ten_su_kien} đã được chuyển từ phòng {$oldRoomName} sang {$newRoom->ten_phong}. Lý do: {$reason}";

            $event->update([
                'ma_phong' => $newRoomId,
            ]);

            $booking->update([
                'ma_phong' => $newRoomId,
                'ghi_chu' => "Điều chuyển từ phòng {$oldRoomName} sang {$newRoom->ten_phong}. Lý do: {$reason}",
            ]);

            // 6. Ghi Audit Log CHANGE_ROOM
            app(ApprovalAuditService::class)->log(
                action: 'CHANGE_ROOM',
                eventId: $eventId,
                previousStatus: $event->trang_thai,
                nextStatus: $event->trang_thai,
                reason: $reason,
                actorUserId: (int) $lockedActor->ma_tai_khoan
            );

            // 7. Gửi thông báo DOI_PHONG_KHAN_CAP cho sinh viên giữ vé và waitlist
            $regUserIds = DangKy::query()
                ->where('ma_su_kien', $eventId)
                ->where('trang_thai', '!=', 'DaHuy')
                ->pluck('ma_tai_khoan')
                ->all();

            $waitlistUserIds = HangDoiWaitlist::query()
                ->where('ma_su_kien', $eventId)
                ->whereIn('trang_thai', ['WAITING', 'OFFERED'])
                ->pluck('ma_tai_khoan')
                ->all();

            $affectedUserIds = array_unique(array_merge($regUserIds, $waitlistUserIds));
            $emailRecipients = User::query()
                ->whereIn('ma_tai_khoan', $affectedUserIds)
                ->whereNotNull('email')
                ->where('email', '<>', '')
                ->get(['email', 'ho_ten']);

            foreach ($affectedUserIds as $uid) {
                ThongBao::create([
                    'ma_tai_khoan' => $uid,
                    'tieu_de' => "Thông báo điều chuyển phòng sự kiện: {$event->ten_su_kien}",
                    'noi_dung' => "Sự kiện \"{$event->ten_su_kien}\" đã được chuyển từ phòng {$oldRoomName} sang phòng {$newRoom->ten_phong}. Lý do: {$reason}",
                    'loai_thong_bao' => 'DOI_PHONG_KHAN_CAP',
                ]);
            }

            // Gửi thông báo cho BTC sự kiện
            if ($event->ma_don_vi_to_chuc) {
                $hostMemberIds = User::query()
                    ->where('ma_don_vi_to_chuc', $event->ma_don_vi_to_chuc)
                    ->where('hoat_dong', 1)
                    ->pluck('ma_tai_khoan');

                foreach ($hostMemberIds as $hostUserId) {
                    ThongBao::create([
                        'ma_tai_khoan' => $hostUserId,
                        'tieu_de' => "Thông báo điều chuyển phòng sự kiện: {$event->ten_su_kien}",
                        'noi_dung' => "Sự kiện \"{$event->ten_su_kien}\" đã được điều chuyển sang phòng {$newRoom->ten_phong}. Lý do: {$reason}",
                        'loai_thong_bao' => 'DOI_PHONG_KHAN_CAP',
                    ]);
                }
            }

            return $event->fresh();
        });

        $this->queueEmergencyEmails(
            $emailRecipients,
            "[Campus Event Hub] Thông báo đổi phòng: {$eventResult->ten_su_kien}",
            $emailRoomChange
        );

        return $eventResult;
    }

    private function queueEmergencyEmails(iterable $recipients, string $subject, string $message): void
    {
        foreach ($recipients as $recipient) {
            Mail::to($recipient->email)->queue(new EventEmergencyMailable(
                (string) $recipient->ho_ten,
                $subject,
                $message
            ));
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
}
