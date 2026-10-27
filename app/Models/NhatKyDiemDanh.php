<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NhatKyDiemDanh extends Model
{
    use HasFactory;

    protected $table = 'nhat_ky_diem_danh';

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'ti_le_drl_cu' => 'decimal:2',
            'ti_le_drl_moi' => 'decimal:2',
            'thoi_gian_tao' => 'datetime',
        ];
    }

    public function dangKy(): BelongsTo
    {
        return $this->belongsTo(DangKy::class, 'ma_dang_ky', 'ma_dang_ky');
    }

    public function nguoiThucHien(): BelongsTo
    {
        return $this->belongsTo(User::class, 'nguoi_thuc_hien', 'ma_tai_khoan');
    }
}
