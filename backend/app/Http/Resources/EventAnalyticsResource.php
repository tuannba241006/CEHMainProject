<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventAnalyticsResource extends JsonResource
{
    /**
     * Transform the resource into an array matching OpenAPI OrganizerDashboard schema.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'ma_su_kien' => (int) $this->resource['ma_su_kien'],
            'khong_gioi_han_slot' => (bool) $this->resource['khong_gioi_han_slot'],
            'so_luong_toi_da' => $this->resource['so_luong_toi_da'] !== null ? (int) $this->resource['so_luong_toi_da'] : null,
            'tong_ve_dang_ky' => (int) $this->resource['tong_ve_dang_ky'],
            'so_luong_check_in' => (int) $this->resource['so_luong_check_in'],
            'so_luong_check_out' => (int) $this->resource['so_luong_check_out'],
            'ty_le_lap_day_pct' => $this->resource['ty_le_lap_day_pct'] !== null ? (float) $this->resource['ty_le_lap_day_pct'] : null,
            'ty_le_show_up_pct' => (float) $this->resource['ty_le_show_up_pct'],
            'so_luong_no_show' => $this->resource['so_luong_no_show'] !== null ? (int) $this->resource['so_luong_no_show'] : null,
            'ty_le_no_show_pct' => $this->resource['ty_le_no_show_pct'] !== null ? (float) $this->resource['ty_le_no_show_pct'] : null,
            'diem_noi_dung_tb' => $this->resource['diem_noi_dung_tb'] !== null ? (float) $this->resource['diem_noi_dung_tb'] : null,
            'diem_dien_gia_tb' => $this->resource['diem_dien_gia_tb'] !== null ? (float) $this->resource['diem_dien_gia_tb'] : null,
            'diem_to_chuc_tb' => $this->resource['diem_to_chuc_tb'] !== null ? (float) $this->resource['diem_to_chuc_tb'] : null,
            'phan_bo_theo_khoa' => $this->resource['phan_bo_theo_khoa'] ?? [],
            'luu_luong_theo_khung_gio' => $this->resource['luu_luong_theo_khung_gio'] ?? [],
        ];
    }
}
