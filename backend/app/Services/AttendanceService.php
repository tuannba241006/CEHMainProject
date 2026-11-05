<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Models\DangKy;
use App\Models\SuKien;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AttendanceService
{
    public function __construct(protected KioskSessionService $kiosk) {}

    public function checkIn(User $user, array $data): DangKy
    {
        return DB::transaction(function () use ($user, $data) {
            $session = $this->kiosk->verifyTotp((int) $data['ma_su_kien'], $data['totp_code']);
            $event = $session->suKien;
            if (! $event->cong_check_in_mo) {
                throw new BusinessException('GATE_CLOSED', 'Cổng Check-in đang đóng.', null, 409);
            }
            $ticket = DangKy::where(['ma_tai_khoan' => $user->ma_tai_khoan, 'ma_su_kien' => $event->ma_su_kien])->lockForUpdate()->first();
            if (! $ticket) {
                throw new BusinessException('TICKET_NOT_FOUND', 'Bạn không có vé tham dự sự kiện này.', null, 404);
            }
            if ($ticket->trang_thai !== 'DaDangKy') {
                throw new BusinessException('ALREADY_CHECKED_IN', 'Vé đã Check-in hoặc không còn hợp lệ.', null, 409);
            }
            $suspicious = DangKy::where('ma_su_kien', $event->ma_su_kien)->where('ma_thiet_bi_check_in', $data['device_id'])->where('ma_tai_khoan', '!=', $user->ma_tai_khoan)->exists();
            if ($suspicious) {
                DangKy::where('ma_su_kien', $event->ma_su_kien)->where('ma_thiet_bi_check_in', $data['device_id'])->update(['nghi_van_gian_lan' => true, 'ma_thiet_bi_nghi_van' => $data['device_id']]);
            }
            $ticket->update(['trang_thai' => 'DaCheckIn', 'da_check_in' => true, 'thoi_gian_check_in' => now(), 'ma_thiet_bi_check_in' => $data['device_id'], 'nghi_van_gian_lan' => $suspicious, 'ma_thiet_bi_nghi_van' => $suspicious ? $data['device_id'] : null]);

            return $ticket->fresh('taiKhoan');
        });
    }

    public function checkOut(User $user, array $data): DangKy
    {
        return DB::transaction(function () use ($user, $data) {
            $session = $this->kiosk->verifyTotp((int) $data['ma_su_kien'], $data['totp_code']);
            $event = $session->suKien;
            if (! $event->cong_check_out_mo) {
                throw new BusinessException('GATE_CLOSED', 'Cổng Check-out đang đóng.', null, 409);
            }
            $ticket = DangKy::where(['ma_tai_khoan' => $user->ma_tai_khoan, 'ma_su_kien' => $event->ma_su_kien])->lockForUpdate()->first();
            if (! $ticket) {
                throw new BusinessException('TICKET_NOT_FOUND', 'Bạn không có vé tham dự sự kiện này.', null, 404);
            }
            if ($ticket->trang_thai !== 'DaCheckIn') {
                throw new BusinessException('NOT_CHECKED_IN', 'Bạn chưa Check-in hoặc đã Check-out.', null, 409);
            }
            $checkout = now();
            $start = $event->thoi_gian_bat_dau;
            $end = $event->thoi_gian_ket_thuc_thuc_te ?: $event->thoi_gian_ket_thuc;
            $denominator = max(1, $end->diffInSeconds($start));
            $effectiveCheckout = $checkout->lessThan($end) ? $checkout : $end;
            $ratio = max(0, min(1, $start->diffInSeconds($effectiveCheckout) / $denominator));
            $full = $ratio >= 0.6;
            $partial = ! $full && $ratio >= 0.3;
            $ticket->update(['trang_thai' => 'DaCheckOut', 'da_check_out' => true, 'thoi_gian_check_out' => $checkout, 'ma_thiet_bi_check_out' => $data['device_id'], 'tham_gia_tron_ven' => $full, 'tham_gia_mot_phan' => $partial, 'ti_le_drl' => $full ? 1.0 : ($partial ? 0.5 : 0.0)]);

            return $ticket->fresh('taiKhoan');
        });
    }

    public function participants(User $actor, int $eventId, array $filters = []): array
    {
        $event = SuKien::findOrFail($eventId);
        if (! $actor->isAdmin() && (int) $actor->ma_don_vi_to_chuc !== (int) $event->ma_don_vi_to_chuc) {
            throw new BusinessException('FORBIDDEN', 'Bạn không có quyền xem danh sách điểm danh.', null, 403);
        }

        return DangKy::with('taiKhoan')->where('ma_su_kien', $eventId)->when($filters['q'] ?? null, fn ($q, $term) => $q->whereHas('taiKhoan', fn ($u) => $u->where('mssv', 'like', "%{$term}%")->orWhere('ho_ten', 'like', "%{$term}%")))->orderBy('ma_dang_ky')->paginate(min(max((int) ($filters['limit'] ?? 20), 1), 100));
    }
}
