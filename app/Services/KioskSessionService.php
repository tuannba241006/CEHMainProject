<?php

namespace App\Services;

use App\Exceptions\BusinessException;
use App\Models\NhatKyKiemDuyet;
use App\Models\PhienKiosk;
use App\Models\SuKien;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KioskSessionService
{
    public function start(SuKien $event, User $actor, Request $request): PhienKiosk
    {
        $this->assertHost($event, $actor);
        if (! in_array($event->trang_thai, ['PUBLISHED', 'HAPPENING'], true)) {
            throw new BusinessException('INVALID_STATE_TRANSITION', 'Chỉ có thể khởi tạo phiên Kiosk khi sự kiện đang ở trạng thái PUBLISHED hoặc HAPPENING.', null, 409);
        }
        if (now()->greaterThanOrEqualTo($event->thoi_gian_ket_thuc->copy()->addMinutes(15))) {
            throw new BusinessException('INVALID_STATE_TRANSITION', 'Không thể khởi tạo phiên Kiosk sau khi thời gian hiệu lực của phiên đã kết thúc.', null, 409);
        }

        return DB::transaction(function () use ($event, $actor, $request) {
            PhienKiosk::where('ma_su_kien', $event->ma_su_kien)
                ->where('da_thu_hoi', false)
                ->update(['da_thu_hoi' => true, 'thoi_gian_thu_hoi' => now()]);
            $token = 'kiosk_live_'.bin2hex(random_bytes(24));
            $session = PhienKiosk::create([
                'ma_su_kien' => $event->ma_su_kien,
                'nguoi_kich_hoat' => $actor->ma_tai_khoan,
                'kiosk_token_hash' => hash('sha256', $token),
                'totp_secret' => $this->base32Encode(random_bytes(20)),
                'ip_address' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 500),
                'thoi_gian_bat_dau' => now(),
                'thoi_gian_het_han' => $event->thoi_gian_ket_thuc->copy()->addMinutes(15),
            ]);
            $session->kiosk_token = $token;

            return $session;
        });
    }

    public function resolveToken(?string $token): PhienKiosk
    {
        $session = $token ? PhienKiosk::with('suKien')->where('kiosk_token_hash', hash('sha256', $token))->first() : null;
        if (! $session || $session->da_thu_hoi || $session->thoi_gian_het_han->isPast()) {
            throw new BusinessException('KIOSK_TOKEN_INVALID', 'Phiên trình chiếu không còn hiệu lực.', null, 401);
        }

        return $session;
    }

    public function totp(PhienKiosk $session): array
    {
        $now = now();
        $counter = intdiv($now->timestamp, 30);
        $code = $this->hotp($session->totp_secret, $counter);
        $expires = Carbon::createFromTimestamp(($counter + 1) * 30, config('app.timezone'));
        $event = $session->suKien;

        return [
            'ma_su_kien' => (int) $event->ma_su_kien,
            'ten_su_kien' => $event->ten_su_kien,
            'che_do_hien_tai' => $event->cong_check_out_mo ? 'CHECK_OUT' : ($event->cong_check_in_mo ? 'CHECK_IN' : 'DONG'),
            'cong_check_in_mo' => (bool) $event->cong_check_in_mo,
            'cong_check_out_mo' => (bool) $event->cong_check_out_mo,
            'totp_code' => $code,
            'qr_payload' => "CEH1K.{$event->ma_su_kien}.{$code}",
            'chu_ky_giay' => 30,
            'het_han_luc' => $expires->toIso8601String(),
            'expires_in_seconds' => max(1, $expires->timestamp - $now->timestamp),
        ];
    }

    public function verifyTotp(int $eventId, string $code): PhienKiosk
    {
        if (! preg_match('/\A[0-9]{6}\z/', $code)) {
            throw new BusinessException('TOTP_INVALID', 'Mã TOTP phải gồm đúng 6 chữ số.', null, 400);
        }

        $now = now();
        $sessions = PhienKiosk::where('ma_su_kien', $eventId)->where('da_thu_hoi', false)->where('thoi_gian_het_han', '>', $now)->get();
        $counter = intdiv($now->timestamp, 30);
        foreach ($sessions as $session) {
            foreach ([$counter, $counter - 1] as $candidate) {
                if (hash_equals($this->hotp($session->totp_secret, $candidate), $code)) {
                    return $session;
                }
            }
        }

        throw new BusinessException('TOTP_INVALID', 'Mã QR đã hết hiệu lực. Vui lòng quét lại mã đang chiếu trên màn hình.', null, 400);
    }

    public function openCheckIn(SuKien $event, User $actor): SuKien
    {
        $this->assertHost($event, $actor);
        if (! in_array($event->trang_thai, ['PUBLISHED', 'HAPPENING'], true) || now()->lt($event->thoi_gian_bat_dau->copy()->subMinutes(30))) {
            throw new BusinessException('GATE_CLOSED', 'Cổng Check-in chỉ được phép mở từ 30 phút trước thời gian bắt đầu sự kiện.', null, 409);
        }
        if (! $event->cong_check_in_mo) {
            $event->update(['cong_check_in_mo' => true, 'thoi_gian_mo_cong_check_in' => now()]);
            NhatKyKiemDuyet::create(['ma_su_kien' => $event->ma_su_kien, 'nguoi_thuc_hien' => $actor->ma_tai_khoan, 'hanh_dong' => 'OPEN_CHECKIN_GATE', 'trang_thai_truoc' => $event->trang_thai, 'trang_thai_sau' => $event->trang_thai, 'ly_do' => 'Mở cổng Check-in']);
        }

        return $event->fresh(['donViHost', 'phongHoiTruong', 'chuyenDe', 'datPhongs', 'dongToChucs', 'nhatKyKiemDuyets.nguoiThucHien']);
    }

    public function openCheckOut(SuKien $event, User $actor, ?string $confirmation, ?string $reason): SuKien
    {
        $this->assertHost($event, $actor);
        $now = now();
        $early = $now->lt($event->thoi_gian_ket_thuc);
        if ($early) {
            if ($now->lt($event->thoi_gian_ket_thuc->copy()->subMinutes(25))) {
                throw new BusinessException('CHECKOUT_TOO_EARLY', 'Chỉ được mở cổng Check-out tối đa 25 phút trước giờ kết thúc kế hoạch.', null, 409);
            }
        }
        if ($early && ! in_array(strtoupper(trim((string) $confirmation)), ['CONFIRM', 'XÁC NHẬN'], true)) {
            throw new BusinessException('CONFIRMATION_REQUIRED', 'Cần xác nhận để mở cổng Check-out sớm.', null, 422);
        }
        if (! $event->cong_check_out_mo) {
            DB::transaction(function () use ($event, $actor, $early, $reason, $now): void {
                $event->update([
                    'cong_check_out_mo' => true,
                    'thoi_gian_ket_thuc_thuc_te' => $early ? $now : $event->thoi_gian_ket_thuc,
                ]);
                if ($early) {
                    NhatKyKiemDuyet::create([
                        'ma_su_kien' => $event->ma_su_kien,
                        'nguoi_thuc_hien' => $actor->ma_tai_khoan,
                        'hanh_dong' => 'EARLY_CHECKOUT_CONFIRM',
                        'trang_thai_truoc' => $event->trang_thai,
                        'trang_thai_sau' => $event->trang_thai,
                        'ly_do' => $reason ?: 'BTC xác nhận mở cổng Check-out sớm (CONFIRM)',
                    ]);
                }
            });
        }

        return $event->fresh(['donViHost', 'phongHoiTruong', 'chuyenDe', 'datPhongs', 'dongToChucs', 'nhatKyKiemDuyets.nguoiThucHien']);
    }

    public function closeGates(SuKien $event, User $actor): SuKien
    {
        $this->assertHost($event, $actor);
        DB::transaction(function () use ($event) {
            $event->update(['cong_check_in_mo' => false, 'cong_check_out_mo' => false]);
            PhienKiosk::where('ma_su_kien', $event->ma_su_kien)->where('da_thu_hoi', false)->update(['da_thu_hoi' => true, 'thoi_gian_thu_hoi' => now()]);
        });

        return $event->fresh(['donViHost', 'phongHoiTruong', 'chuyenDe', 'datPhongs', 'dongToChucs', 'nhatKyKiemDuyets.nguoiThucHien']);
    }

    public function assertHost(SuKien $event, User $actor): void
    {
        if (! $actor->isAdmin() && (int) $event->ma_don_vi_to_chuc !== (int) $actor->ma_don_vi_to_chuc) {
            throw new BusinessException('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này với sự kiện.', null, 403);
        }
    }

    protected function hotp(string $secret, int $counter): string
    {
        $binary = $this->base32Decode($secret);
        $data = pack('N2', ($counter >> 32) & 0xFFFFFFFF, $counter & 0xFFFFFFFF);
        $hash = hash_hmac('sha1', $data, $binary, true);
        $offset = ord($hash[19]) & 0x0F;
        $value = ((ord($hash[$offset]) & 0x7F) << 24) | (ord($hash[$offset + 1]) << 16) | (ord($hash[$offset + 2]) << 8) | ord($hash[$offset + 3]);

        return str_pad((string) ($value % 1000000), 6, '0', STR_PAD_LEFT);
    }

    protected function base32Encode(string $data): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $bits = '';
        $out = '';
        foreach (str_split($data) as $char) {
            $bits .= str_pad(decbin(ord($char)), 8, '0', STR_PAD_LEFT);
        }
        foreach (str_split($bits, 5) as $chunk) {
            $out .= $alphabet[bindec(str_pad($chunk, 5, '0'))];
        }

        return $out;
    }

    protected function base32Decode(string $data): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $bits = '';
        $data = strtoupper($data);
        foreach (str_split($data) as $char) {
            $pos = strpos($alphabet, $char);
            if ($pos !== false) {
                $bits .= str_pad(decbin($pos), 5, '0', STR_PAD_LEFT);
            }
        }
        $out = '';
        foreach (str_split($bits, 8) as $chunk) {
            if (strlen($chunk) === 8) {
                $out .= chr(bindec($chunk));
            }
        }

        return $out;
    }
}
