<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WaitlistResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $event = $this->suKien;
        $room = $event?->phongHoiTruong;
        $deadline = $this->han_chot_xac_nhan ? Carbon::parse($this->han_chot_xac_nhan) : null;

        return [
            'id' => (int) $this->id,
            'ma_su_kien' => (int) $this->ma_su_kien,
            'ten_su_kien' => (string) ($event?->ten_su_kien ?? ''),
            'thoi_gian_bat_dau' => $event?->thoi_gian_bat_dau?->copy()->setTimezone('+07:00')->toIso8601String(),
            'thoi_gian_ket_thuc' => $event?->thoi_gian_ket_thuc?->copy()->setTimezone('+07:00')->toIso8601String(),
            'ten_phong' => (string) ($room?->ten_phong ?? ''),
            'co_so' => $room?->co_so instanceof \BackedEnum ? $room->co_so->value : (string) ($room?->co_so ?? 'CoSo1'),
            'so_thu_tu' => (int) $this->so_thu_tu,
            'trang_thai' => (string) $this->trang_thai,
            'thoi_gian_dang_ky' => $this->thoi_gian_dang_ky?->copy()->setTimezone('+07:00')->toIso8601String(),
            'han_chot_xac_nhan' => $deadline?->copy()->setTimezone('+07:00')->toIso8601String(),
            'thoi_gian_phan_hoi' => $this->thoi_gian_phan_hoi?->copy()->setTimezone('+07:00')->toIso8601String(),
            'so_giay_con_lai' => $this->trang_thai === 'OFFERED' && $deadline
                ? max(0, (int) now()->diffInSeconds($deadline, false))
                : null,
        ];
    }
}
