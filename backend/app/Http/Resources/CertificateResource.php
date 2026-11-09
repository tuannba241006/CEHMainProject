<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CertificateResource extends JsonResource
{
    /**
     * Transform the resource into an array conforming to Certificate schema (OpenAPI v3.2.3).
     */
    public function toArray(Request $request): array
    {
        $dangKy = $this->dangKy;
        $suKien = $dangKy?->suKien;
        $donVi = $suKien?->donViToChuc;

        $tiLeDrl = (float) ($dangKy?->ti_le_drl ?? 0);
        $diemDrlDuKien = (float) ($suKien?->diem_drl_du_kien ?? 0);

        return [
            'id' => (int) $this->id,
            'ma_dang_ky' => (int) $this->ma_dang_ky,
            'ma_tai_khoan' => (int) ($dangKy?->ma_tai_khoan ?? 0),
            'ma_su_kien' => (int) ($dangKy?->ma_su_kien ?? 0),
            'ten_su_kien' => (string) ($suKien?->ten_su_kien ?? ''),
            'don_vi_to_chuc' => (string) ($donVi?->ten_don_vi ?? ''),
            'ngay_cap' => $this->ngay_cap ? Carbon::parse($this->ngay_cap)->setTimezone('+07:00')->toIso8601String() : null,
            'ma_hash' => (string) $this->ma_hash,
            'ty_le_tham_du_pct' => (float) round($tiLeDrl * 100, 1),
            'diem_drl_thuc_nhan' => (float) round($diemDrlDuKien * $tiLeDrl, 2),
            'file_pdf_url' => "/api/v1/certificates/{$this->id}/download",
            'da_thu_hoi' => (bool) $this->da_thu_hoi,
            'thoi_gian_thu_hoi' => $this->thoi_gian_thu_hoi ? Carbon::parse($this->thoi_gian_thu_hoi)->setTimezone('+07:00')->toIso8601String() : null,
        ];
    }
}
