<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParticipantAttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $student = $this->taiKhoan;

        return [
            'ma_dang_ky' => (int) $this->ma_dang_ky,
            'ma_tai_khoan' => (int) $this->ma_tai_khoan,
            'mssv' => $student?->mssv,
            'ho_ten' => (string) ($student?->ho_ten ?? ''),
            'lop_sinh_hoat' => $student?->lop_sinh_hoat,
            'khoa' => $student?->khoa,
            'trang_thai' => $this->trang_thai,
            'da_check_in' => (bool) $this->da_check_in,
            'da_check_out' => (bool) $this->da_check_out,
            'thoi_gian_dang_ky' => $this->thoi_gian_dang_ky?->toIso8601String(),
            'thoi_gian_check_in' => $this->thoi_gian_check_in?->toIso8601String(),
            'thoi_gian_check_out' => $this->thoi_gian_check_out?->toIso8601String(),
            'thoi_luong_tham_du_phut' => $this->getAttribute('thoi_luong_tham_du_phut'),
            'ty_le_tham_du_pct' => $this->getAttribute('ty_le_tham_du_pct'),
            'ti_le_drl' => (float) $this->ti_le_drl,
            'da_feedback' => (bool) $this->da_feedback,
            'han_an_han_feedback' => $this->han_an_han_feedback?->toIso8601String(),
            'du_dieu_kien_drl' => (bool) $this->du_dieu_kien_drl,
            'nghi_van_gian_lan' => (bool) $this->nghi_van_gian_lan,
            'ma_thiet_bi_nghi_van' => $this->ma_thiet_bi_nghi_van,
            'vi_pham_no_show' => (bool) $this->vi_pham_no_show,
            'ghi_chu' => $this->ghi_chu,
        ];
    }
}
