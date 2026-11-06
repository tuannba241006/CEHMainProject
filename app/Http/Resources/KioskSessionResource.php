<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KioskSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ma_phien_kiosk' => (int) $this->ma_phien_kiosk,
            'ma_su_kien' => (int) $this->ma_su_kien,
            'kiosk_token' => $this->resource->kiosk_token ?? null,
            'thoi_gian_bat_dau' => $this->thoi_gian_bat_dau?->toIso8601String(),
            'thoi_gian_het_han' => $this->thoi_gian_het_han?->toIso8601String(),
        ];
    }
}
