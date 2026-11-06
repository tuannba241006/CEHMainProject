<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Models\DangKy;
use App\Models\SuKien;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class AttendanceService
{
    public function __construct(
        protected KioskSessionService $kiosk,
        protected AttendanceScoringService $scoring,
    ) {}

    public function checkIn(User $user, array $data): DangKy
    {
        return $this->attend($user, $data, checkOut: false);
    }

    public function checkOut(User $user, array $data): DangKy
    {
        return $this->attend($user, $data, checkOut: true);
    }

    private function attend(User $user, array $data, bool $checkOut): DangKy
    {
        $deviceId = $data['device_id'];
        $result = DB::transaction(function () use ($user, $data, $deviceId, $checkOut): DangKy|BusinessException {
            // Serialize device claims before any consistent read in the transaction.
            $event = SuKien::lockForUpdate()->find($data['ma_su_kien']);
            if (! $event) {
                throw new BusinessException('NOT_FOUND', 'Không tìm thấy sự kiện.', null, 404);
            }
            $this->kiosk->verifyTotp($event->getKey(), $data['totp_code']);
            $gateOpen = $checkOut ? $event->cong_check_out_mo : $event->cong_check_in_mo;
            if (! $gateOpen || ! in_array($event->trang_thai, ['PUBLISHED', 'HAPPENING'], true)) {
                throw new BusinessException('GATE_CLOSED', $checkOut ? 'Cổng Check-out đang đóng.' : 'Cổng Check-in đang đóng.', null, 409);
            }

            $ticket = DangKy::where('ma_tai_khoan', $user->getKey())
                ->where('ma_su_kien', $event->getKey())
                ->orderByRaw('ma_tk_hieu_luc IS NULL')
                ->latest('ma_dang_ky')
                ->lockForUpdate()
                ->first();

            if (! $ticket) {
                throw new BusinessException('NOT_FOUND', 'Bạn không có vé tham dự sự kiện này.', null, 404);
            }

            $this->assertCanAttend($ticket, $checkOut);

            $otherTickets = DangKy::where('ma_su_kien', $event->getKey())
                ->where('ma_tai_khoan', '!=', $user->getKey())
                ->where(fn ($query) => $query->where('ma_thiet_bi_check_in', $deviceId)->orWhere('ma_thiet_bi_check_out', $deviceId))
                ->pluck('ma_dang_ky');

            $wrongDevice = $checkOut && $ticket->ma_thiet_bi_check_in !== null && $ticket->ma_thiet_bi_check_in !== $deviceId;
            $usedByAnotherAccount = $otherTickets->isNotEmpty();
            if ($usedByAnotherAccount || $wrongDevice) {
                $affected = DangKy::whereKey($otherTickets->push($ticket->getKey())->all());
                $affected->update(['nghi_van_gian_lan' => true, 'vi_pham_no_show' => false]);
                $affected->whereNull('ma_thiet_bi_nghi_van')->update(['ma_thiet_bi_nghi_van' => $deviceId]);

                $message = $usedByAnotherAccount
                    ? 'Thiết bị này đã được dùng để điểm danh cho tài khoản khác.'
                    : 'Thiết bị Check-out không khớp với thiết bị đã dùng để Check-in.';

                return new BusinessException(
                    'DEVICE_ALREADY_USED',
                    $message.' Vui lòng gặp nhân viên soát vé để được đối soát thẻ sinh viên.',
                    null,
                    403,
                );
            }

            if ($checkOut) {
                return $this->completeCheckOut($event, $ticket, $deviceId);
            }

            $ticket->update([
                'trang_thai' => 'DaCheckIn',
                'da_check_in' => true,
                'thoi_gian_check_in' => now(),
                'ma_thiet_bi_check_in' => $deviceId,
                'vi_pham_no_show' => false,
            ]);

            return $ticket;
        }, 3);

        if ($result instanceof BusinessException) {
            throw $result;
        }

        return $result;
    }

    private function assertCanAttend(DangKy $ticket, bool $checkOut): void
    {
        if (! $checkOut && $ticket->trang_thai !== 'DaDangKy') {
            throw new BusinessException('ALREADY_CHECKED_IN', 'Vé đã Check-in hoặc không còn hợp lệ.', null, 409);
        }

        if ($checkOut) {
            if (in_array($ticket->trang_thai, ['DaCheckOut', 'DaHuy'], true)) {
                throw new BusinessException('TICKET_ALREADY_USED', 'Vé đã được sử dụng hoặc không còn hợp lệ.', null, 409);
            }
            if ($ticket->trang_thai !== 'DaCheckIn' || ! $ticket->da_check_in || ! $ticket->thoi_gian_check_in) {
                throw new BusinessException('NOT_CHECKED_IN', 'Bạn chưa thực hiện Check-in đầu giờ nên không thể Check-out.', null, 409);
            }
        }
    }

    private function completeCheckOut(SuKien $event, DangKy $ticket, string $deviceId): DangKy
    {
        $checkout = now();
        if ($checkout->lt($ticket->thoi_gian_check_in)) {
            throw new BusinessException('NOT_CHECKED_IN', 'Vé chưa có thời điểm Check-in hợp lệ.', null, 409);
        }
        $score = $this->scoring->scoreWithAttendancePercentage($event, $ticket, $checkout);
        $responseFields = Arr::only($score, ['thoi_luong_tham_du_phut', 'ty_le_tham_du_pct']);
        $ticket->update([
            'trang_thai' => 'DaCheckOut',
            'da_check_out' => true,
            'thoi_gian_check_out' => $checkout,
            'ma_thiet_bi_check_out' => $deviceId,
            ...array_diff_key($score, $responseFields),
        ]);

        return $ticket->forceFill($responseFields);
    }

    public function participants(User $actor, int $eventId, array $filters = []): LengthAwarePaginator
    {
        $event = SuKien::findOrFail($eventId);
        if (! $actor->isAdmin() && (int) $actor->ma_don_vi_to_chuc !== (int) $event->ma_don_vi_to_chuc) {
            throw new BusinessException('FORBIDDEN', 'Bạn không có quyền xem danh sách điểm danh.', null, 403);
        }

        return DangKy::with('taiKhoan')->where('ma_su_kien', $eventId)->when($filters['q'] ?? null, fn ($q, $term) => $q->whereHas('taiKhoan', fn ($u) => $u->where('mssv', 'like', "%{$term}%")->orWhere('ho_ten', 'like', "%{$term}%")))->orderBy('ma_dang_ky')->paginate(min(max((int) ($filters['limit'] ?? 20), 1), 100));
    }
}
