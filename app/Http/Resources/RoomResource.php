<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'ma_phong' => (int) $this->ma_phong,
            'ten_phong' => $this->ten_phong,
            'co_so' => $this->co_so instanceof \BackedEnum ? $this->co_so->value : (string) $this->co_so,
            'suc_chua_toi_da' => (int) $this->suc_chua_toi_da,
            'trang_thiet_bi' => $this->trang_thiet_bi ?? [],
            'trang_thai' => $this->trang_thai instanceof \BackedEnum ? $this->trang_thai->value : (string) $this->trang_thai,
            'bao_tri_tu_ngay' => $this->bao_tri_tu_ngay ? $this->bao_tri_tu_ngay->format('Y-m-d H:i:s') : null,
            'bao_tri_den_ngay' => $this->bao_tri_den_ngay ? $this->bao_tri_den_ngay->format('Y-m-d H:i:s') : null,
            'da_xoa' => (bool) $this->da_xoa,
            'thoi_gian_tao' => $this->thoi_gian_tao?->format('Y-m-d H:i:s'),
            'thoi_gian_cap_nhat' => $this->thoi_gian_cap_nhat?->format('Y-m-d H:i:s'),
        ];
    }
}
