<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SuKien extends Model
{
    use HasFactory;

    protected $table = 'su_kien';

    protected $primaryKey = 'ma_su_kien';

    const CREATED_AT = 'thoi_gian_tao';

    const UPDATED_AT = 'thoi_gian_cap_nhat';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'lo_trinh' => 'array',
            'ngay_cong_bo' => 'datetime',
            'thoi_gian_bat_dau' => 'datetime',
            'thoi_gian_ket_thuc' => 'datetime',
            'thoi_gian_ket_thuc_thuc_te' => 'datetime',
            'khong_gioi_han_slot' => 'boolean',
            'so_luong_toi_da' => 'integer',
            'so_ve_con_lai' => 'integer',
            'so_slot_dong_bang' => 'integer',
            'thoi_diem_het_ve' => 'datetime',
            'diem_drl_du_kien' => 'integer',
            'gio_tinh_nguyen' => 'decimal:1',
            'cong_check_in_mo' => 'boolean',
            'thoi_gian_mo_cong_check_in' => 'datetime',
            'cong_check_out_mo' => 'boolean',
            'da_chot_drl' => 'boolean',
            'thoi_gian_chot_drl' => 'datetime',
            'thoi_gian_tao' => 'datetime',
            'thoi_gian_cap_nhat' => 'datetime',
        ];
    }

    public function donViToChuc(): BelongsTo
    {
        return $this->belongsTo(DonViToChuc::class, 'ma_don_vi_to_chuc', 'ma_don_vi_to_chuc');
    }

    public function donViHost(): BelongsTo
    {
        return $this->belongsTo(DonViToChuc::class, 'ma_don_vi_to_chuc', 'ma_don_vi_to_chuc');
    }

    public function chuyenDe(): BelongsTo
    {
        return $this->belongsTo(ChuyenDe::class, 'ma_chuyen_de', 'ma_chuyen_de');
    }

    public function phongHoiTruong(): BelongsTo
    {
        return $this->belongsTo(PhongHoiTruong::class, 'ma_phong', 'ma_phong');
    }

    public function dongToChucs(): HasMany
    {
        return $this->hasMany(SuKienDongToChuc::class, 'ma_su_kien', 'ma_su_kien');
    }

    public function datPhongs(): HasMany
    {
        return $this->hasMany(DatPhong::class, 'ma_su_kien', 'ma_su_kien');
    }

    public function phienKiosks(): HasMany
    {
        return $this->hasMany(PhienKiosk::class, 'ma_su_kien', 'ma_su_kien');
    }

    public function dangKys(): HasMany
    {
        return $this->hasMany(DangKy::class, 'ma_su_kien', 'ma_su_kien');
    }

    public function waitlists(): HasMany
    {
        return $this->hasMany(HangDoiWaitlist::class, 'ma_su_kien', 'ma_su_kien');
    }

    public function nhanVienCheckIns(): HasMany
    {
        return $this->hasMany(NhanVienCheckIn::class, 'ma_su_kien', 'ma_su_kien');
    }

    public function nhatKyKiemDuyets(): HasMany
    {
        return $this->hasMany(NhatKyKiemDuyet::class, 'ma_su_kien', 'ma_su_kien');
    }
}
