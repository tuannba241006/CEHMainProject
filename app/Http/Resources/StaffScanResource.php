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
            'sinh_vien' => [
                'ho_ten' => $user?->ho_ten,
                'mssv' => $user?->mssv,
                'khoa' => $user?->khoa,
                'lop_sinh_hoat' => $user?->lop_sinh_hoat,
            ],
            'canh_bao_doi_soat_the_sv' => (bool) $this->nghi_van_gian_lan,
            'trang_thai_ve' => $this->trang_thai,
            'thoi_gian_quet' => ($this->thoi_gian_check_out ?: $this->thoi_gian_check_in)?->toIso8601String(),
            'thoi_luong_tham_du_phut' => $this->getAttribute('thoi_luong_tham_du_phut'),
            'ti_le_drl' => $this->da_check_out ? (float) $this->ti_le_drl : null,
        ];
    }
}
