<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SelfCheckOutResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ma_dang_ky' => (int) $this->ma_dang_ky,
            'trang_thai' => $this->trang_thai,
            'thoi_gian_check_out' => $this->thoi_gian_check_out->setTimezone('+07:00')->toIso8601String(),
            'thoi_luong_tham_du_phut' => (int) $this->thoi_luong_tham_du_phut,
            'ty_le_tham_du_pct' => (float) $this->ty_le_tham_du_pct,
            'ti_le_drl' => (float) $this->ti_le_drl,
        ];
    }
}
