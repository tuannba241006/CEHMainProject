<?php

namespace App\Http\Resources;

use App\Services\CertificateService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VerifyCertificateResource extends JsonResource
{
    /**
     * Transform the resource into an array conforming to CertificatePublic schema (OpenAPI v3.2.3).
     */
    public function toArray(Request $request): array
    {
        if ($this->da_thu_hoi) {
            return [
                'trang_thai' => 'DA_THU_HOI',
                'da_thu_hoi' => true,
                'ho_ten_che_mo' => null,
                'mssv_che_mo' => null,
                'ten_su_kien' => null,
                'don_vi_to_chuc' => null,
                'ngay_cap' => null,
            ];
        }

        $dangKy = $this->dangKy;
        $student = $dangKy?->taiKhoan;
        $suKien = $dangKy?->suKien;
        $donVi = $suKien?->donViToChuc;

        return [
            'trang_thai' => 'HOP_LE',
            'da_thu_hoi' => false,
            'ho_ten_che_mo' => $student?->ho_ten ? CertificateService::maskName($student->ho_ten) : null,
            'mssv_che_mo' => $student?->mssv ? CertificateService::maskMssv($student->mssv) : null,
            'ten_su_kien' => (string) ($suKien?->ten_su_kien ?? ''),
            'don_vi_to_chuc' => (string) ($donVi?->ten_don_vi ?? ''),
            'ngay_cap' => $this->ngay_cap ? Carbon::parse($this->ngay_cap)->setTimezone('+07:00')->toIso8601String() : null,
        ];
    }
}
