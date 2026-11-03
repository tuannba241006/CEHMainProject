<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventPublicDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $tz = 'Asia/Ho_Chi_Minh';

        $organization = function ($unit): ?array {
            if (!$unit) {
                return null;
            }

            return [
                'ma_don_vi_to_chuc' => (int) $unit->ma_don_vi_to_chuc,
                'ma_don_vi_cha' => $unit->ma_don_vi_cha,
                'ten_don_vi' => $unit->ten_don_vi,
                'ma_dinh_danh' => $unit->ma_dinh_danh,
                'loai_don_vi' => $unit->loai_don_vi,
                'logo_url' => $unit->logo_url,
            ];
        };

        $room = $this->phongHoiTruong;

        return [
            'ma_su_kien' => (int) $this->ma_su_kien,
            'ten_su_kien' => $this->ten_su_kien,
            'anh_bia' => $this->anh_bia,
            'dien_gia' => $this->dien_gia,
            'mo_ta' => $this->mo_ta,
            'lo_trinh' => $this->lo_trinh,
            'doi_tuong_tham_gia' => $this->doi_tuong_tham_gia,

            'chuyen_de' => [
                'ma_chuyen_de' => (int) $this->chuyenDe->ma_chuyen_de,
                'ten_chuyen_de' => $this->chuyenDe->ten_chuyen_de,
                'mo_ta' => $this->chuyenDe->mo_ta,
                'da_xoa' => (bool) $this->chuyenDe->da_xoa,
            ],

            'don_vi_host' => $organization($this->donViHost),

            'danh_sach_dong_to_chuc' => $this->dongToChucs
                ->map(fn ($cohost) => $organization(
                    $cohost->donViToChuc
                ))
                ->filter()
                ->values()
                ->all(),

            'phong' => [
                'ma_phong' => (int) $room->ma_phong,
                'ten_phong' => $room->ten_phong,
                'co_so' => $room->co_so,
                'suc_chua_toi_da' => (int) $room->suc_chua_toi_da,
            ],

            'ngay_cong_bo' => $this->ngay_cong_bo
                ?->copy()
                ->setTimezone($tz)
                ->toIso8601String(),

            'thoi_gian_bat_dau' => $this->thoi_gian_bat_dau
                ?->copy()
                ->setTimezone($tz)
                ->toIso8601String(),

            'thoi_gian_ket_thuc' => $this->thoi_gian_ket_thuc
                ?->copy()
                ->setTimezone($tz)
                ->toIso8601String(),

            'khong_gioi_han_slot' => (bool) $this->khong_gioi_han_slot,
            'so_luong_toi_da' => $this->so_luong_toi_da,
            'so_ve_con_lai' => $this->so_ve_con_lai,
            'dieu_khoan_drl' => $this->dieu_khoan_drl,
            'diem_drl_du_kien' => (int) $this->diem_drl_du_kien,
            'gio_tinh_nguyen' => (float) $this->gio_tinh_nguyen,
            'trang_thai' => $this->trang_thai,
        ];
    }
}
