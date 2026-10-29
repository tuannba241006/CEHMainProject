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
        $isAvailable = (bool) $this['available'];
        $conflicts = $this['conflicts'] ?? [];
        $firstConflict = !empty($conflicts) ? $conflicts[0] : null;
        $maintenanceConflict = $this['maintenance_conflict'] ?? null;

        $lyDoXungDot = null;
        $khoangXungDot = null;

        if (!$isAvailable) {
            if ($maintenanceConflict) {
                $lyDoXungDot = 'ROOM_MAINTENANCE_CONFLICT';
                $khoangXungDot = [
                    'loai_khoang' => 'BAO_TRI',
                    'ma_su_kien' => null,
                    'tieu_de' => $maintenanceConflict['ly_do_bao_tri'] ?? 'Bảo trì phòng',
                    'ten_don_vi_host' => null,
                    'thoi_gian_bat_dau' => $maintenanceConflict['bat_dau_bao_tri'] ?? null,
                    'thoi_gian_ket_thuc' => $maintenanceConflict['ket_thuc_bao_tri'] ?? null,
                    'han_giu_cho_tam' => null,
                ];
            } elseif ($firstConflict) {
                $lyDoXungDot = 'ROOM_CONFLICT';
                $khoangXungDot = [
                    'loai_khoang' => ($firstConflict['trang_thai'] ?? '') === 'Pending' ? 'PENDING_HOLD' : 'CONFIRMED',
                    'ma_su_kien' => $firstConflict['ma_su_kien'] ?? null,
                    'tieu_de' => $firstConflict['ten_su_kien'] ?? '',
                    'ten_don_vi_host' => $firstConflict['ten_don_vi_host'] ?? null,
                    'thoi_gian_bat_dau' => $firstConflict['thoi_gian_bat_dau'] ?? null,
                    'thoi_gian_ket_thuc' => $firstConflict['thoi_gian_ket_thuc'] ?? null,
                    'han_giu_cho_tam' => $firstConflict['han_giu_cho_tam'] ?? null,
                ];
            }
        }

        return [
            // OpenAPI v3.2.3 fields
            'kha_dung' => $isAvailable,
            'ly_do_xung_dot' => $lyDoXungDot,
            'khoang_xung_dot' => $khoangXungDot,

            // Backward compatibility fields for existing feature tests
            'available' => $isAvailable,
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
            }, $conflicts),
            'maintenance_conflict' => $maintenanceConflict ? [
                'bat_dau_bao_tri' => (string) $maintenanceConflict['bat_dau_bao_tri'],
                'ket_thuc_bao_tri' => (string) $maintenanceConflict['ket_thuc_bao_tri'],
                'ly_do_bao_tri' => (string) ($maintenanceConflict['ly_do_bao_tri'] ?? ''),
            ] : null,
        ];
    }
}
