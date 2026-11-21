<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DrlRecordResource extends JsonResource
{
    /**
     * Transform the resource into an array matching OpenAPI DrlRecord schema.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'stt' => (int) $this->stt,
            'mssv' => (string) $this->mssv,
            'ho_ten' => (string) $this->ho_ten,
            'lop_sinh_hoat' => $this->lop_sinh_hoat ? (string) $this->lop_sinh_hoat : null,
            'khoa' => $this->khoa ? (string) $this->khoa : null,
            'ten_su_kien' => (string) $this->ten_su_kien,
            'dieu_drl' => (string) $this->dieu_drl,
            'diem_cong_thuc_nhan' => (float) $this->diem_cong_thuc_nhan,
            'thoi_gian_vao' => $this->thoi_gian_vao ? Carbon::parse($this->thoi_gian_vao)->setTimezone('+07:00')->toIso8601String() : null,
            'thoi_gian_ra' => $this->thoi_gian_ra ? Carbon::parse($this->thoi_gian_ra)->setTimezone('+07:00')->toIso8601String() : null,
            'thoi_luong_tham_du_phut' => (int) $this->thoi_luong_tham_du_phut,
            'ghi_chu_tham_du' => $this->ghi_chu_tham_du ? (string) $this->ghi_chu_tham_du : null,
        ];
    }
}
