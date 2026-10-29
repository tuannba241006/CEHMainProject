<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomScheduleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $blocks = collect();

        // 1. Bookings
        $bookings = $this['bookings'] ?? [];
        foreach ($bookings as $b) {
            $loaiKhoang = ($b['trang_thai'] ?? '') === 'Pending' ? 'PENDING_HOLD' : 'CONFIRMED';
            $blocks->push([
                'loai_khoang' => $loaiKhoang,
                'ma_su_kien' => isset($b['ma_su_kien']) ? (int) $b['ma_su_kien'] : null,
                'tieu_de' => $b['ten_su_kien'] ?? '',
                'ten_don_vi_host' => $b['ten_don_vi_host'] ?? null,
                'thoi_gian_bat_dau' => $b['thoi_gian_bat_dau'] ?? null,
                'thoi_gian_ket_thuc' => $b['thoi_gian_ket_thuc'] ?? null,
                'han_giu_cho_tam' => $b['han_giu_cho_tam'] ?? null,
            ]);
        }

        // 2. Bảo trì
        $maintenance = $this['maintenance'] ?? [];
        foreach ($maintenance as $m) {
            $blocks->push([
                'loai_khoang' => 'BAO_TRI',
                'ma_su_kien' => null,
                'tieu_de' => $m['ly_do_bao_tri'] ?? 'Bảo trì phòng',
                'ten_don_vi_host' => null,
                'thoi_gian_bat_dau' => $m['bat_dau_bao_tri'] ?? null,
                'thoi_gian_ket_thuc' => $m['ket_thuc_bao_tri'] ?? null,
                'han_giu_cho_tam' => null,
            ]);
        }

        // Sắp xếp theo thời gian bắt đầu
        return $blocks->sortBy('thoi_gian_bat_dau')->values()->all();
    }
}
