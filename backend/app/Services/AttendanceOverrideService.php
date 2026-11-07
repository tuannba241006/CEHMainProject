<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Models\DangKy;
use App\Models\NhatKyDiemDanh;
use App\Models\SuKien;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AttendanceOverrideService
{
    public function manualOverride(User $actor, array $data): DangKy
    {
        $eventId = DangKy::whereKey($data['ma_dang_ky'])->value('ma_su_kien');
        if ($eventId === null) {
            throw new BusinessException('NOT_FOUND', 'Không tìm thấy vé tham dự.', null, 404);
        }

        return DB::transaction(function () use ($actor, $data, $eventId) {
            $event = SuKien::lockForUpdate()->find($eventId);
            if (! $event) {
                throw new BusinessException('NOT_FOUND', 'Không tìm thấy sự kiện.', null, 404);
            }
            if (! $actor->isAdmin() && (! $actor->isToChuc() || (int) $actor->ma_don_vi_to_chuc !== (int) $event->ma_don_vi_to_chuc)) {
                throw new BusinessException('FORBIDDEN', 'Bạn không có quyền điều chỉnh điểm danh sự kiện này.', null, 403);
            }

            $ticket = DangKy::where('ma_su_kien', $eventId)->lockForUpdate()->find($data['ma_dang_ky']);
            if (! $ticket) {
                throw new BusinessException('NOT_FOUND', 'Không tìm thấy vé tham dự.', null, 404);
            }
            if ($ticket->trang_thai === 'DaHuy') {
                throw new BusinessException('INVALID_STATE_TRANSITION', 'Không thể điều chỉnh điểm danh cho vé đã hủy.', null, 409);
            }
            if ($event->da_chot_drl) {
                throw new BusinessException('DRL_LOCKED', 'Danh sách ĐRL của sự kiện đã bị khóa chốt.', null, 409);
            }

            $oldStatus = $ticket->trang_thai;
            $oldRate = (float) $ticket->ti_le_drl;
            $newStatus = $data['trang_thai_moi'];
            $newRate = (float) $data['ti_le_drl_moi'];
            if ($oldStatus === $newStatus && $oldRate === $newRate) {
                throw new BusinessException('INVALID_STATE_TRANSITION', 'Trạng thái và tỷ lệ ĐRL không thay đổi.', null, 409);
            }

            $checkOut = $newStatus === 'DaCheckOut';
            $now = now();
            $eventStart = $event->thoi_gian_bat_dau;
            $eventEnd = $event->thoi_gian_ket_thuc_thuc_te ?? $event->thoi_gian_ket_thuc;
            $checkedInAt = $ticket->thoi_gian_check_in ?? ($checkOut ? $eventStart : $now->min($eventStart));
            $checkedOutAt = $checkOut ? ($ticket->thoi_gian_check_out ?? $eventEnd) : null;
            if ($checkedOutAt?->lt($checkedInAt)) {
                throw new BusinessException('INVALID_STATE_TRANSITION', 'Thời điểm Check-out không thể trước thời điểm Check-in đã ghi nhận.', null, 409);
            }

            $attributes = [
                'trang_thai' => $newStatus,
                'ti_le_drl' => $newRate,
                'vi_pham_no_show' => false,
                'nghi_van_gian_lan' => false,
                'ma_thiet_bi_nghi_van' => null,
                'da_check_in' => true,
                'da_check_out' => $checkOut,
                'thoi_gian_check_in' => $checkedInAt,
                'thoi_gian_check_out' => $checkedOutAt,
                'tham_gia_tron_ven' => $newRate === 1.0,
                'tham_gia_mot_phan' => $newRate === 0.5,
            ];
            if (! $checkOut) {
                $attributes += ['da_feedback' => false, 'du_dieu_kien_drl' => false];
            }
            if ($checkOut && $actor->isAdmin() && ! $ticket->da_feedback && $event->thoi_gian_ket_thuc->copy()->addHours(48)->lt($now)) {
                $attributes['han_an_han_feedback'] = $now->copy()->addHours(24);
            }

            $ticket->update($attributes);
            NhatKyDiemDanh::create([
                'ma_dang_ky' => $ticket->getKey(),
                'nguoi_thuc_hien' => $actor->getKey(),
                'trang_thai_cu' => $oldStatus,
                'trang_thai_moi' => $newStatus,
                'ti_le_drl_cu' => $oldRate,
                'ti_le_drl_moi' => $newRate,
                'ly_do' => $data['ly_do'],
            ]);

            return $ticket->load('taiKhoan');
        }, 3);
    }
}
