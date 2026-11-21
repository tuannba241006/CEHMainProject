<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ManualOverrideResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ma_dang_ky' => (int) $this->ma_dang_ky,
            'ma_tai_khoan' => (int) $this->ma_tai_khoan,
            'mssv' => $this->taiKhoan->mssv,
            'ho_ten' => $this->taiKhoan->ho_ten,
            'lop_sinh_hoat' => $this->taiKhoan->lop_sinh_hoat,
            'khoa' => $this->taiKhoan->khoa,
            'trang_thai' => $this->trang_thai,
            'da_check_in' => (bool) $this->da_check_in,
            'da_check_out' => (bool) $this->da_check_out,
            'thoi_gian_check_in' => $this->thoi_gian_check_in?->setTimezone('+07:00')->toIso8601String(),
            'thoi_gian_check_out' => $this->thoi_gian_check_out?->setTimezone('+07:00')->toIso8601String(),
            'ti_le_drl' => (float) $this->ti_le_drl,
            'da_feedback' => (bool) $this->da_feedback,
            'han_an_han_feedback' => $this->han_an_han_feedback?->setTimezone('+07:00')->toIso8601String(),
            'du_dieu_kien_drl' => (bool) $this->du_dieu_kien_drl,
            'nghi_van_gian_lan' => (bool) $this->nghi_van_gian_lan,
            'ma_thiet_bi_nghi_van' => $this->ma_thiet_bi_nghi_van,
            'vi_pham_no_show' => (bool) $this->vi_pham_no_show,
            'ghi_chu' => $this->ghi_chu,
        ];
    }
}
