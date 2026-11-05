<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Models\DangKy;
use App\Models\NhatKyDiemDanh;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AttendanceOverrideService
{
    public function manualOverride(User $actor, array $data): DangKy
    {
        return DB::transaction(function () use ($actor, $data) {
            $ticket = DangKy::with('suKien')->lockForUpdate()->find($data['ma_dang_ky']);
            if (! $ticket) {
                throw new BusinessException('TICKET_NOT_FOUND', 'Không tìm thấy vé tham dự.', null, 404);
            }
            $event = $ticket->suKien;
            if (! $actor->isAdmin() && (int) $actor->ma_don_vi_to_chuc !== (int) $event->ma_don_vi_to_chuc) {
                throw new BusinessException('FORBIDDEN', 'Bạn không có quyền điều chỉnh điểm danh sự kiện này.', null, 403);
            }
            if ($event->da_chot_drl) {
                throw new BusinessException('DRL_LOCKED', 'Danh sách ĐRL của sự kiện đã bị khóa chốt.', null, 409);
            }
            $oldStatus = $ticket->trang_thai;
            $oldRate = (float) $ticket->ti_le_drl;
            $newStatus = $data['trang_thai_moi'];
            $newRate = (float) $data['ti_le_drl_moi'];
            if ($oldStatus === $newStatus && $oldRate === $newRate && ! ($data['xoa_no_show'] ?? false)) {
                throw new BusinessException('INVALID_STATE_TRANSITION', 'Trạng thái và tỷ lệ ĐRL không thay đổi.', null, 409);
            }
            $attributes = ['trang_thai' => $newStatus, 'ti_le_drl' => $newRate, 'vi_pham_no_show' => ($data['xoa_no_show'] ?? false) ? false : $ticket->vi_pham_no_show];
            if ($newStatus === 'DaCheckIn') {
                $attributes += ['da_check_in' => true, 'da_check_out' => false, 'thoi_gian_check_in' => $ticket->thoi_gian_check_in ?: now(), 'thoi_gian_check_out' => null, 'tham_gia_tron_ven' => false, 'tham_gia_mot_phan' => false];
            }
            if ($newStatus === 'DaCheckOut') {
                $attributes += ['da_check_in' => true, 'da_check_out' => true, 'thoi_gian_check_in' => $ticket->thoi_gian_check_in ?: now(), 'thoi_gian_check_out' => $ticket->thoi_gian_check_out ?: now(), 'tham_gia_tron_ven' => $newRate === 1.0, 'tham_gia_mot_phan' => $newRate === 0.5];
            }
            $ticket->update($attributes);
            NhatKyDiemDanh::create(['ma_dang_ky' => $ticket->ma_dang_ky, 'nguoi_thuc_hien' => $actor->ma_tai_khoan, 'trang_thai_cu' => $oldStatus, 'trang_thai_moi' => $newStatus, 'ti_le_drl_cu' => $oldRate, 'ti_le_drl_moi' => $newRate, 'ly_do' => $data['ly_do']]);
            if ($event->thoi_gian_ket_thuc->copy()->addHours(48)->isPast()) {
                $ticket->update(['han_an_han_feedback' => now()->addHours(24)]);
            }

            return $ticket->fresh('taiKhoan');
        });
    }
}
