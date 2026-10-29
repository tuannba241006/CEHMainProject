<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomScheduleBlockResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $data = is_array($this->resource) ? $this->resource : (array) $this->resource;

        return [
            'loai_khoang' => $data['loai_khoang'] ?? null,
            'ma_su_kien' => isset($data['ma_su_kien']) ? (int) $data['ma_su_kien'] : null,
            'tieu_de' => $data['tieu_de'] ?? '',
            'ten_don_vi_host' => $data['ten_don_vi_host'] ?? null,
            'thoi_gian_bat_dau' => $data['thoi_gian_bat_dau'] ?? null,
            'thoi_gian_ket_thuc' => $data['thoi_gian_ket_thuc'] ?? null,
            'han_giu_cho_tam' => $data['han_giu_cho_tam'] ?? null,
        ];
    }
}
