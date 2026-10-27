<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'tai_khoan';

    protected $primaryKey = 'ma_tai_khoan';

    const CREATED_AT = 'thoi_gian_tao';

    const UPDATED_AT = 'thoi_gian_cap_nhat';

    protected $guarded = [];

    protected $hidden = [
        'mat_khau',
    ];

    public function getAuthPassword()
    {
        return $this->mat_khau;
    }

    protected function casts(): array
    {
        return [
            'dong_y_nghi_dinh_13' => 'boolean',
            'buoc_doi_mat_khau' => 'boolean',
            'hoat_dong' => 'boolean',
            'thoi_gian_dong_y_nd13' => 'datetime',
            'thoi_gian_tao' => 'datetime',
            'thoi_gian_cap_nhat' => 'datetime',
        ];
    }

    // Role helper methods
    public function isAdmin(): bool
    {
        return $this->loai_tai_khoan === 'Admin';
    }

    public function isToChuc(): bool
    {
        return $this->loai_tai_khoan === 'ToChuc';
    }

    public function isSinhVien(): bool
    {
        return $this->loai_tai_khoan === 'SinhVien';
    }

    // Relationships
    public function donViToChuc(): BelongsTo
    {
        return $this->belongsTo(DonViToChuc::class, 'ma_don_vi_to_chuc', 'ma_don_vi_to_chuc');
    }

    public function khoa(): BelongsTo
    {
        return $this->belongsTo(DonViToChuc::class, 'ma_khoa', 'ma_don_vi_to_chuc');
    }

    public function dangKys(): HasMany
    {
        return $this->hasMany(DangKy::class, 'ma_tai_khoan', 'ma_tai_khoan');
    }

    public function waitlists(): HasMany
    {
        return $this->hasMany(HangDoiWaitlist::class, 'ma_tai_khoan', 'ma_tai_khoan');
    }

    public function thongBaos(): HasMany
    {
        return $this->hasMany(ThongBao::class, 'ma_tai_khoan', 'ma_tai_khoan');
    }

    public function nhatKyKiemDuyetThucHien(): HasMany
    {
        return $this->hasMany(NhatKyKiemDuyet::class, 'nguoi_thuc_hien', 'ma_tai_khoan');
    }
}
