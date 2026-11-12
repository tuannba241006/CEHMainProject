<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NoShowViolatorResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'ma_tai_khoan' => (int) $this->ma_tai_khoan,
            'mssv' => (string) $this->mssv,
            'ho_ten' => (string) $this->ho_ten,
            'email' => (string) $this->email,
            'lop_sinh_hoat' => $this->lop_sinh_hoat,
            'khoa' => (string) $this->khoa,
            'so_lan_vi_pham' => (int) $this->so_lan_vi_pham,
            'hoat_dong' => (bool) $this->hoat_dong,
            'su_kien_vi_pham_gan_nhat' => $this->su_kien_vi_pham_gan_nhat,
        ];
    }
}
