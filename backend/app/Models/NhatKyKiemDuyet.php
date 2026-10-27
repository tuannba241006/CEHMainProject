<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NhatKyKiemDuyet extends Model
{
    use HasFactory;

    protected $table = 'nhat_ky_kiem_duyet';

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'thoi_gian_tao' => 'datetime',
        ];
    }

    public function suKien(): BelongsTo
    {
        return $this->belongsTo(SuKien::class, 'ma_su_kien', 'ma_su_kien');
    }

    public function dangKy(): BelongsTo
    {
        return $this->belongsTo(DangKy::class, 'ma_dang_ky', 'ma_dang_ky');
    }

    public function taiKhoanMucTieu(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ma_tai_khoan_muc_tieu', 'ma_tai_khoan');
    }

    public function nguoiThucHien(): BelongsTo
    {
        return $this->belongsTo(User::class, 'nguoi_thuc_hien', 'ma_tai_khoan');
    }
}
