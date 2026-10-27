<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NhanVienCheckIn extends Model
{
    use HasFactory;

    protected $table = 'nhan_vien_check_in';

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'thoi_gian_phan_cong' => 'datetime',
        ];
    }

    public function taiKhoan(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ma_tai_khoan', 'ma_tai_khoan');
    }

    public function suKien(): BelongsTo
    {
        return $this->belongsTo(SuKien::class, 'ma_su_kien', 'ma_su_kien');
    }

    public function nguoiPhanCong(): BelongsTo
    {
        return $this->belongsTo(User::class, 'nguoi_phan_cong', 'ma_tai_khoan');
    }
}
