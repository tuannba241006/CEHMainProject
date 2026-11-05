<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StaffScanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $this->taiKhoan;

        return [
            'ma_dang_ky' => (int) $this->ma_dang_ky,
            'ma_su_kien' => (int) $this->ma_su_kien,
            'trang_thai' => $this->trang_thai,
            'ho_ten' => $user?->ho_ten,
            'mssv' => $user?->mssv,
            'khoa' => $user?->khoa,
            'lop_sinh_hoat' => $user?->lop_sinh_hoat,
            'nghi_van_gian_lan' => (bool) $this->nghi_van_gian_lan,
            'ma_thiet_bi_nghi_van' => $this->ma_thiet_bi_nghi_van,
            'thoi_gian_check_in' => $this->thoi_gian_check_in?->toIso8601String(),
            'thoi_gian_check_out' => $this->thoi_gian_check_out?->toIso8601String(),
        ];
    }
}
