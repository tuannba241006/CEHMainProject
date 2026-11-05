<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParticipantAttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return (new StaffScanResource($this->resource))->toArray($request) + [
            'ti_le_drl' => (float) $this->ti_le_drl,
            'tham_gia_tron_ven' => (bool) $this->tham_gia_tron_ven,
            'tham_gia_mot_phan' => (bool) $this->tham_gia_mot_phan,
            'vi_pham_no_show' => (bool) $this->vi_pham_no_show,
        ];
    }
}
