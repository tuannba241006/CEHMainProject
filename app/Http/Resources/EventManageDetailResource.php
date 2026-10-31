<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventManageDetailResource extends JsonResource
{
    /**
     * Transform the resource into an array matching OpenAPI EventManageDetail schema.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $hostUnit = $this->donViHost ?? $this->donViToChuc;
        $room = $this->phongHoiTruong;
        $topic = $this->chuyenDe;

        // Xử lý hạn giữ chỗ tạm thời của phòng (nếu có bản ghi PENDING)
        $hanGiuChoTam = null;
        if ($this->relationLoaded('datPhongs')) {
            $pendingDatPhong = $this->datPhongs->firstWhere('trang_thai', 'PENDING');
            $hanGiuChoTam = $pendingDatPhong?->han_giu_cho_tam?->toIso8601String();
        } else {
            $hanVal = $this->datPhongs()->where('trang_thai', 'PENDING')->value('han_giu_cho_tam');
            if ($hanVal) {
                $hanGiuChoTam = Carbon::parse($hanVal)->toIso8601String();
            }
        }

        // Lịch sử kiểm duyệt
        $auditLogs = [];
        if ($this->relationLoaded('nhatKyKiemDuyets')) {
            $auditLogs = $this->nhatKyKiemDuyets->map(function ($log) {
                $actor = $log->nguoiThucHien;

                return [
                    'id' => (int) $log->id,
                    'hanh_dong' => (string) $log->hanh_dong,
                    'nguoi_thuc_hien' => $actor ? [
                        'ma_tai_khoan' => (int) $actor->ma_tai_khoan,
                        'ho_ten' => (string) $actor->ho_ten,
                        'email' => (string) $actor->email,
                        'loai_tai_khoan' => (string) $actor->loai_tai_khoan,
                    ] : null,
                    'trang_thai_truoc' => $log->trang_thai_truoc,
                    'trang_thai_sau' => $log->trang_thai_sau,
                    'ly_do' => $log->ly_do,
                    'thoi_gian_tao' => $log->thoi_gian_tao ? Carbon::parse($log->thoi_gian_tao)->toIso8601String() : null,
                ];
            })->values()->all();
        }

        // Danh sách đồng tổ chức
        $cohosts = [];
        if ($this->relationLoaded('dongToChucs')) {
            $cohosts = CohostInvitationResource::collection($this->dongToChucs)->resolve();
        }

        $coSo = $room?->co_so;
        if ($coSo instanceof \BackedEnum) {
            $coSo = $coSo->value;
        }

        $roomStatus = $room?->trang_thai;
        if ($roomStatus instanceof \BackedEnum) {
            $roomStatus = $roomStatus->value;
        }

        return [
            'ma_su_kien' => (int) $this->ma_su_kien,
            'ten_su_kien' => (string) $this->ten_su_kien,
            'anh_bia' => $this->anh_bia,
            'dien_gia' => $this->dien_gia,
            'mo_ta' => (string) $this->mo_ta,
            'lo_trinh' => $this->lo_trinh,
            'doi_tuong_tham_gia' => $this->doi_tuong_tham_gia,
            'chuyen_de' => $topic ? [
                'ma_chuyen_de' => (int) $topic->ma_chuyen_de,
                'ten_chuyen_de' => (string) $topic->ten_chuyen_de,
                'mo_ta' => $topic->mo_ta,
            ] : null,
            'don_vi_host' => $hostUnit ? [
                'ma_don_vi_to_chuc' => (int) $hostUnit->ma_don_vi_to_chuc,
                'ten_don_vi' => (string) $hostUnit->ten_don_vi,
                'ma_dinh_danh' => (string) $hostUnit->ma_dinh_danh,
                'loai_don_vi' => (string) $hostUnit->loai_don_vi,
                'logo_url' => $hostUnit->logo_url,
            ] : null,
            'danh_sach_dong_to_chuc' => $cohosts,
            'phong' => $room ? [
                'ma_phong' => (int) $room->ma_phong,
                'ten_phong' => (string) $room->ten_phong,
                'co_so' => (string) ($coSo ?? 'CoSo1'),
                'suc_chua_toi_da' => (int) $room->suc_chua_toi_da,
                'trang_thiet_bi' => $room->trang_thiet_bi,
                'trang_thai' => (string) ($roomStatus ?? 'KhaDung'),
            ] : null,
            'han_giu_cho_tam_phong' => $hanGiuChoTam,
            'ngay_cong_bo' => $this->ngay_cong_bo?->toIso8601String(),
            'thoi_gian_bat_dau' => $this->thoi_gian_bat_dau?->toIso8601String(),
            'thoi_gian_ket_thuc' => $this->thoi_gian_ket_thuc?->toIso8601String(),
            'thoi_gian_ket_thuc_thuc_te' => $this->thoi_gian_ket_thuc_thuc_te?->toIso8601String(),
            'khong_gioi_han_slot' => (bool) $this->khong_gioi_han_slot,
            'so_luong_toi_da' => $this->so_luong_toi_da !== null ? (int) $this->so_luong_toi_da : null,
            'so_ve_con_lai' => $this->so_ve_con_lai !== null ? (int) $this->so_ve_con_lai : null,
            'so_slot_dong_bang' => (int) ($this->so_slot_dong_bang ?? 0),
            'thoi_diem_het_ve' => $this->thoi_diem_het_ve?->toIso8601String(),
            'dieu_khoan_drl' => (string) $this->dieu_khoan_drl,
            'diem_drl_du_kien' => (int) $this->diem_drl_du_kien,
            'gio_tinh_nguyen' => (float) ($this->gio_tinh_nguyen ?? 0.0),
            'trang_thai' => (string) $this->trang_thai,
            'cong_check_in_mo' => (bool) $this->cong_check_in_mo,
            'thoi_gian_mo_cong_check_in' => $this->thoi_gian_mo_cong_check_in?->toIso8601String(),
            'cong_check_out_mo' => (bool) $this->cong_check_out_mo,
            'da_chot_drl' => (bool) $this->da_chot_drl,
            'thoi_gian_chot_drl' => $this->thoi_gian_chot_drl?->toIso8601String(),
            'lich_su_kiem_duyet' => $auditLogs,
            'thoi_gian_tao' => $this->thoi_gian_tao?->toIso8601String(),
            'thoi_gian_cap_nhat' => $this->thoi_gian_cap_nhat?->toIso8601String(),
        ];
    }
}
