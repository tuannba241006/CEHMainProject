<?php

namespace App\Http\Resources;

use App\Models\NhanVienCheckIn;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array conforming to OpenAPI v3.2.3 User schema.
     */
    public function toArray(Request $request): array
    {
        $donVi = null;
        if ($this->donViToChuc) {
            $donVi = [
                'ma_don_vi_to_chuc' => $this->donViToChuc->ma_don_vi_to_chuc,
                'ten_don_vi' => $this->donViToChuc->ten_don_vi,
                'ma_dinh_danh' => $this->donViToChuc->ma_dinh_danh,
                'loai_don_vi' => $this->donViToChuc->loai_don_vi,
                'ma_don_vi_cha' => $this->donViToChuc->ma_don_vi_cha,
            ];
        }

        // Check if student is assigned as check-in staff for any event today
        $laNhanVienSoatVe = false;
        if ($this->loai_tai_khoan === 'SinhVien') {
            $laNhanVienSoatVe = NhanVienCheckIn::where('ma_tai_khoan', $this->ma_tai_khoan)
                ->whereHas('suKien', function ($query) {
                    $query->whereDate('thoi_gian_bat_dau', '<=', today())
                        ->whereDate('thoi_gian_ket_thuc', '>=', today());
                })
                ->exists();
        }

        return [
            'ma_tai_khoan' => (int) $this->ma_tai_khoan,
            'ho_ten' => $this->ho_ten,
            'mssv' => $this->mssv,
            'email' => $this->email,
            'loai_tai_khoan' => $this->loai_tai_khoan,
            'so_dien_thoai' => $this->so_dien_thoai,
            'lop_sinh_hoat' => $this->lop_sinh_hoat,
            'ma_khoa' => $this->ma_khoa ? (int) $this->ma_khoa : null,
            'khoa' => is_string($this->khoa) && $this->khoa !== '' ? $this->khoa : ($this->donViKhoa?->ten_don_vi ?? null),
            'ma_don_vi_to_chuc' => $this->ma_don_vi_to_chuc ? (int) $this->ma_don_vi_to_chuc : null,
            'don_vi' => $donVi,
            'avatar_url' => $this->avatar_url,
            'dong_y_nghi_dinh_13' => (bool) $this->dong_y_nghi_dinh_13,
            'buoc_doi_mat_khau' => (bool) $this->buoc_doi_mat_khau,
            'la_nhan_vien_soat_ve' => $laNhanVienSoatVe,
            'hoat_dong' => (bool) $this->hoat_dong,
            'thoi_gian_tao' => $this->thoi_gian_tao?->setTimezone('+07:00')->toIso8601String(),
        ];
    }
}
