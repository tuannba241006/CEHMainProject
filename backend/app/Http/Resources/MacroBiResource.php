<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MacroBiResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'tu_ngay' => $this->resource['tu_ngay'],
            'den_ngay' => $this->resource['den_ngay'],
            'tong_so_su_kien' => (int) $this->resource['tong_so_su_kien'],
            'tong_luot_sinh_vien_tham_gia' => (int) $this->resource['tong_luot_sinh_vien_tham_gia'],
            'ty_le_show_up_toan_truong_pct' => (float) $this->resource['ty_le_show_up_toan_truong_pct'],
            'ty_le_no_show_toan_truong_pct' => (float) $this->resource['ty_le_no_show_toan_truong_pct'],
            'toc_do_chay_ve_phut_tb' => $this->resource['toc_do_chay_ve_phut_tb'] !== null
                ? (float) $this->resource['toc_do_chay_ve_phut_tb']
                : null,
            'su_kien_theo_chuyen_de' => $this->resource['su_kien_theo_chuyen_de'],
            'su_kien_theo_cap_don_vi' => $this->resource['su_kien_theo_cap_don_vi'],
            'cong_suat_su_dung_phong' => $this->resource['cong_suat_su_dung_phong'],
            'top_don_vi_hoat_dong_tich_cuc' => $this->resource['top_don_vi_hoat_dong_tich_cuc'],
        ];
    }
}
