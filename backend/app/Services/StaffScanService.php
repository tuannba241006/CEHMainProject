<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Models\DangKy;
use App\Models\NhanVienCheckIn;
use App\Models\SuKien;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class StaffScanService
{
    public function __construct(
        protected CryptoService $crypto,
        protected AttendanceScoringService $scoring,
    ) {}

    public function scan(User $actor, array $data): DangKy
    {
        [$uuid, $userId, $eventId, $signature] = explode('.', substr($data['chuoi_qr_ve'], 5), 4);
        if (! $this->crypto->verifyTicket($signature, $uuid, (int) $userId, (int) $eventId)) {
            throw new BusinessException('TICKET_INVALID_SIGNATURE', 'Mã vé không hợp lệ hoặc đã bị chỉnh sửa.', null, 400);
        }
        if ((int) $eventId !== (int) $data['ma_su_kien']) {
            throw new BusinessException('TICKET_WRONG_EVENT', 'Vé này thuộc sự kiện khác, không dùng được tại đây.', null, 400);
        }

        return DB::transaction(function () use ($actor, $data, $uuid, $userId, $eventId, $signature) {
            $event = SuKien::find($eventId);
            if (! $event) {
                throw new BusinessException('EVENT_NOT_FOUND', 'Không tìm thấy sự kiện.', null, 404);
            }
            $assigned = $actor->isAdmin() || ($actor->isToChuc() && (int) $actor->ma_don_vi_to_chuc === (int) $event->ma_don_vi_to_chuc) || NhanVienCheckIn::where(['ma_tai_khoan' => $actor->ma_tai_khoan, 'ma_su_kien' => $eventId])->exists();
            if (! $assigned || ! in_array($event->trang_thai, ['PUBLISHED', 'HAPPENING'], true) || ! now()->between($event->thoi_gian_bat_dau->copy()->startOfDay(), $event->thoi_gian_ket_thuc->copy()->endOfDay())) {
                throw new BusinessException('STAFF_NOT_ASSIGNED', 'Bạn không có quyền soát vé tại sự kiện này.', null, 403);
            }
            $ticket = DangKy::with('taiKhoan')->where('ma_ve_uuid', $uuid)->where('ma_tai_khoan', $userId)->where('ma_su_kien', $eventId)->lockForUpdate()->first();
            if (! $ticket || ! hash_equals((string) $ticket->chu_ky_hmac, $signature)) {
                throw new BusinessException('TICKET_INVALID_SIGNATURE', 'Mã vé không hợp lệ hoặc đã bị chỉnh sửa.', null, 400);
            }
            if ($data['che_do_quet'] === 'CHECK_IN') {
                if (! $event->cong_check_in_mo) {
                    throw new BusinessException('GATE_CLOSED', 'Cổng Check-in đang đóng.', null, 409);
                }
                if ($ticket->trang_thai !== 'DaDangKy') {
                    throw new BusinessException('TICKET_ALREADY_USED', 'Vé đã được sử dụng hoặc không còn hợp lệ.', null, 409);
                }
                $ticket->update(['trang_thai' => 'DaCheckIn', 'da_check_in' => true, 'thoi_gian_check_in' => now()]);
            } else {
                if (! $event->cong_check_out_mo) {
                    throw new BusinessException('GATE_CLOSED', 'Cổng Check-out đang đóng.', null, 409);
                }
                if ($ticket->trang_thai !== 'DaCheckIn') {
                    throw new BusinessException('TICKET_ALREADY_USED', 'Vé chưa Check-in hoặc đã Check-out.', null, 409);
                }
                $checkout = now();
                $score = $this->scoring->score($event, $ticket, $checkout);
                $attendedMinutes = $score['thoi_luong_tham_du_phut'];
                unset($score['thoi_luong_tham_du_phut']);
                $ticket->update([
                    'trang_thai' => 'DaCheckOut',
                    'da_check_out' => true,
                    'thoi_gian_check_out' => $checkout,
                    ...$score,
                ]);
            }

            $ticket = $ticket->fresh(['taiKhoan', 'suKien']);
            if ($data['che_do_quet'] === 'CHECK_OUT') {
                $ticket->setAttribute('thoi_luong_tham_du_phut', $attendedMinutes);
            }

            return $ticket;
        });
    }
}
