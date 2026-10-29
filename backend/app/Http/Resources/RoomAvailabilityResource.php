<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomAvailabilityResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'available' => (bool) $this['available'],
            'conflicts' => array_map(function ($c) {
                return [
                    'ma_dat_phong' => (int) $c['ma_dat_phong'],
                    'ma_su_kien' => (int) $c['ma_su_kien'],
                    'ten_su_kien' => (string) ($c['ten_su_kien'] ?? ''),
                    'thoi_gian_bat_dau' => (string) $c['thoi_gian_bat_dau'],
                    'thoi_gian_ket_thuc' => (string) $c['thoi_gian_ket_thuc'],
                    'trang_thai' => (string) $c['trang_thai'],
                    'conflict_type' => (string) ($c['conflict_type'] ?? 'BUFFER_OVERLAP'),
                ];
            }, $this['conflicts'] ?? []),
            'maintenance_conflict' => $this['maintenance_conflict'] ? [
                'bat_dau_bao_tri' => (string) $this['maintenance_conflict']['bat_dau_bao_tri'],
                'ket_thuc_bao_tri' => (string) $this['maintenance_conflict']['ket_thuc_bao_tri'],
                'ly_do_bao_tri' => (string) ($this['maintenance_conflict']['ly_do_bao_tri'] ?? ''),
            ] : null,
        ];
    }
}
