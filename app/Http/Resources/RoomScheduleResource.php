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
        return [
            'room' => [
                'ma_phong' => (int) $this['room']['ma_phong'],
                'ten_phong' => (string) $this['room']['ten_phong'],
                'co_so' => (string) $this['room']['co_so'],
            ],
            'range' => [
                'tu_ngay' => (string) $this['range']['tu_ngay'],
                'den_ngay' => (string) $this['range']['den_ngay'],
            ],
            'maintenance' => array_map(function ($m) {
                return [
                    'bat_dau_bao_tri' => $m['bat_dau_bao_tri'],
                    'ket_thuc_bao_tri' => $m['ket_thuc_bao_tri'],
                    'ly_do_bao_tri' => $m['ly_do_bao_tri'] ?? null,
                ];
            }, $this['maintenance'] ?? []),
            'bookings' => array_map(function ($b) {
                return [
                    'ma_dat_phong' => (int) $b['ma_dat_phong'],
                    'ma_su_kien' => (int) $b['ma_su_kien'],
                    'ten_su_kien' => (string) ($b['ten_su_kien'] ?? ''),
                    'thoi_gian_bat_dau' => (string) $b['thoi_gian_bat_dau'],
                    'thoi_gian_ket_thuc' => (string) $b['thoi_gian_ket_thuc'],
                    'trang_thai' => (string) $b['trang_thai'],
                ];
            }, $this['bookings'] ?? []),
        ];
    }
}
