<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    /**
     * Transform the resource into an array conforming to Notification schema (OpenAPI v3.2.3).
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'tieu_de' => (string) $this->tieu_de,
            'noi_dung' => (string) $this->noi_dung,
            'loai_thong_bao' => (string) $this->loai_thong_bao,
            'lien_ket' => $this->lien_ket !== null ? (string) $this->lien_ket : null,
            'da_doc' => (bool) $this->da_doc,
            'thoi_gian_gui' => $this->thoi_gian_gui
                ? Carbon::parse($this->thoi_gian_gui)->setTimezone('+07:00')->toIso8601String()
                : null,
        ];
    }
}
