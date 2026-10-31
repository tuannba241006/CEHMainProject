<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventCardResource extends JsonResource
{
    /**
     * Transform the resource into an array matching OpenAPI EventCard schema.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $cohostNames = [];
        if ($this->relationLoaded('dongToChucs')) {
            $cohostNames = $this->dongToChucs->map(function ($dc) {
                return $dc->donViToChuc?->ten_don_vi ?? '';
            })->filter()->values()->all();
        }

        $coSo = $this->phongHoiTruong?->co_so;
        if ($coSo instanceof \BackedEnum) {
            $coSo = $coSo->value;
        }

        return [
            'ma_su_kien' => (int) $this->ma_su_kien,
            'ten_su_kien' => (string) $this->ten_su_kien,
            'anh_bia' => $this->anh_bia,
            'dien_gia' => $this->dien_gia,
            'ten_chuyen_de' => (string) ($this->chuyenDe?->ten_chuyen_de ?? ''),
            'ten_don_vi_host' => (string) ($this->donViHost?->ten_don_vi ?? $this->donViToChuc?->ten_don_vi ?? ''),
            'danh_sach_ten_dong_to_chuc' => $cohostNames,
            'ten_phong' => (string) ($this->phongHoiTruong?->ten_phong ?? ''),
            'co_so' => (string) ($coSo ?? 'CoSo1'),
            'thoi_gian_bat_dau' => $this->thoi_gian_bat_dau?->toIso8601String(),
            'thoi_gian_ket_thuc' => $this->thoi_gian_ket_thuc?->toIso8601String(),
            'khong_gioi_han_slot' => (bool) $this->khong_gioi_han_slot,
            'so_luong_toi_da' => $this->so_luong_toi_da !== null ? (int) $this->so_luong_toi_da : null,
            'so_ve_con_lai' => $this->so_ve_con_lai !== null ? (int) $this->so_ve_con_lai : null,
            'trang_thai' => (string) $this->trang_thai,
            'dieu_khoan_drl' => (string) $this->dieu_khoan_drl,
            'diem_drl_du_kien' => (int) $this->diem_drl_du_kien,
        ];
    }
}
