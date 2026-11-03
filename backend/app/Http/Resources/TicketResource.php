<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    /**
     * Transform the resource into an array conforming to TicketDetail schema (OpenAPI v3.2.3).
     */
    public function toArray(Request $request): array
    {
        $suKien = $this->suKien;
        $phong = $suKien?->phongHoiTruong;

        $startTime = $suKien?->thoi_gian_bat_dau ? Carbon::parse($suKien->thoi_gian_bat_dau) : null;
        $endTime = $suKien?->thoi_gian_ket_thuc ? Carbon::parse($suKien->thoi_gian_ket_thuc) : null;

        $hanChotHuy = $startTime ? $startTime->copy()->subHours(4) : null;
        $choPhepHuy = $this->trang_thai === 'DaDangKy' && $hanChotHuy && now()->lt($hanChotHuy);

        $hanFeedback = $endTime ? $endTime->copy()->addHours(48) : null;
        if ($this->han_an_han_feedback && $hanFeedback) {
            $hanFeedback = Carbon::parse($this->han_an_han_feedback)->gt($hanFeedback)
                ? Carbon::parse($this->han_an_han_feedback)
                : $hanFeedback;
        }

        $coTheFeedback = (bool) ($this->da_check_out && ! $this->da_feedback);
        $coTheNhanChungNhan = (bool) ($this->du_dieu_kien_drl && (float) $this->ti_le_drl >= 0.5);

        $payloadQr = sprintf(
            'CEH1.%s.%d.%d.%s',
            $this->ma_ve_uuid,
            $this->ma_tai_khoan,
            $this->ma_su_kien,
            $this->chu_ky_hmac
        );

        return [
            'ma_dang_ky' => (int) $this->ma_dang_ky,
            'ma_ve_uuid' => (string) $this->ma_ve_uuid,
            'ma_su_kien' => (int) $this->ma_su_kien,
            'ten_su_kien' => (string) ($suKien?->ten_su_kien ?? ''),
            'trang_thai_su_kien' => (string) ($suKien?->trang_thai ?? ''),
            'thoi_gian_bat_dau' => $startTime?->setTimezone('+07:00')->toIso8601String(),
            'thoi_gian_ket_thuc' => $endTime?->setTimezone('+07:00')->toIso8601String(),
            'ten_phong' => (string) ($phong?->ten_phong ?? ''),
            'co_so' => (string) ($phong?->co_so instanceof \BackedEnum ? $phong->co_so->value : ($phong?->co_so ?? 'CoSo1')),
            'trang_thai' => (string) $this->trang_thai,
            'thoi_gian_dang_ky' => $this->thoi_gian_dang_ky ? Carbon::parse($this->thoi_gian_dang_ky)->setTimezone('+07:00')->toIso8601String() : null,
            'thoi_gian_check_in' => $this->thoi_gian_check_in ? Carbon::parse($this->thoi_gian_check_in)->setTimezone('+07:00')->toIso8601String() : null,
            'thoi_gian_check_out' => $this->thoi_gian_check_out ? Carbon::parse($this->thoi_gian_check_out)->setTimezone('+07:00')->toIso8601String() : null,
            'thoi_gian_huy' => $this->thoi_gian_huy ? Carbon::parse($this->thoi_gian_huy)->setTimezone('+07:00')->toIso8601String() : null,
            'ly_do_huy' => $this->ly_do_huy,
            'han_chot_huy' => $hanChotHuy?->setTimezone('+07:00')->toIso8601String(),
            'cho_phep_huy' => (bool) $choPhepHuy,
            'ti_le_drl' => (float) $this->ti_le_drl,
            'diem_drl_du_kien' => (int) ($suKien?->diem_drl_du_kien ?? 0),
            'da_feedback' => (bool) $this->da_feedback,
            'han_feedback' => $hanFeedback?->setTimezone('+07:00')->toIso8601String(),
            'han_an_han_feedback' => $this->han_an_han_feedback ? Carbon::parse($this->han_an_han_feedback)->setTimezone('+07:00')->toIso8601String() : null,
            'co_the_feedback' => $coTheFeedback,
            'du_dieu_kien_drl' => (bool) $this->du_dieu_kien_drl,
            'ma_chung_nhan' => $this->chungNhan?->ma_chung_nhan ? (int) $this->chungNhan->ma_chung_nhan : null,
            'co_the_nhan_chung_nhan' => $coTheNhanChungNhan,
            'vi_pham_no_show' => (bool) $this->vi_pham_no_show,
            'nghi_van_gian_lan' => (bool) $this->nghi_van_gian_lan,
            'chu_ky_hmac' => (string) $this->chu_ky_hmac,
            'payload_qr' => $payloadQr,
            'yeu_cau_wake_lock' => true,
            'ma_thiet_bi_nghi_van' => $this->ma_thiet_bi_nghi_van,
        ];
    }
}
