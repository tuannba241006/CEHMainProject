<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CohostInvitationResource extends JsonResource
{
    /**
     * Transform the resource into an array matching OpenAPI CohostInvitationStatus schema.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $event = $this->suKien;
        $hostUnit = $event?->donViHost ?? $event?->donViToChuc;
        $cohostUnit = $this->donViToChuc;

        // Tìm hạn giữ chỗ tạm thời nếu có
        $hanGiuChoTam = null;
        if ($event) {
            if ($event->relationLoaded('datPhongs')) {
                $pendingDatPhong = $event->datPhongs->firstWhere('trang_thai', 'PENDING');
                $hanGiuChoTam = $pendingDatPhong?->han_giu_cho_tam?->toIso8601String();
            } else {
                $hanGiuChoTam = $event->datPhongs()
                    ->where('trang_thai', 'PENDING')
                    ->value('han_giu_cho_tam');
                if ($hanGiuChoTam) {
                    $hanGiuChoTam = Carbon::parse($hanGiuChoTam)->toIso8601String();
                }
            }
        }

        return [
            'id' => (int) $this->id,
            'ma_su_kien' => (int) $this->ma_su_kien,
            'ten_su_kien' => (string) ($event?->ten_su_kien ?? ''),
            'thoi_gian_bat_dau' => $event?->thoi_gian_bat_dau?->toIso8601String(),
            'thoi_gian_ket_thuc' => $event?->thoi_gian_ket_thuc?->toIso8601String(),
            'han_giu_cho_tam' => $hanGiuChoTam,
            'don_vi_host' => $hostUnit ? [
                'ma_don_vi_to_chuc' => (int) $hostUnit->ma_don_vi_to_chuc,
                'ten_don_vi' => (string) $hostUnit->ten_don_vi,
                'ma_dinh_danh' => (string) $hostUnit->ma_dinh_danh,
                'loai_don_vi' => (string) $hostUnit->loai_don_vi,
                'logo_url' => $hostUnit->logo_url,
            ] : null,
            'don_vi_dong_to_chuc' => $cohostUnit ? [
                'ma_don_vi_to_chuc' => (int) $cohostUnit->ma_don_vi_to_chuc,
                'ten_don_vi' => (string) $cohostUnit->ten_don_vi,
                'ma_dinh_danh' => (string) $cohostUnit->ma_dinh_danh,
                'loai_don_vi' => (string) $cohostUnit->loai_don_vi,
                'logo_url' => $cohostUnit->logo_url,
            ] : null,
            'trang_thai_xac_nhan' => (string) $this->trang_thai_xac_nhan,
            'thoi_gian_phan_hoi' => $this->thoi_gian_phan_hoi?->toIso8601String(),
            'ghi_chu_tu_choi' => $this->ghi_chu_tu_choi,
            'thoi_gian_tao' => $this->thoi_gian_tao ? Carbon::parse($this->thoi_gian_tao)->toIso8601String() : null,
        ];
    }
}
