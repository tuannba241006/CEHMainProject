<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaiKhoanQuyen extends Model
{
    protected $table = 'tai_khoan_quyen';

    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'thoi_gian_cap' => 'datetime',
            'thoi_gian_thu_hoi' => 'datetime',
        ];
    }

    public function taiKhoan(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'ma_tai_khoan',
            'ma_tai_khoan'
        );
    }

    public function nguoiCap(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'nguoi_cap',
            'ma_tai_khoan'
        );
    }

    public function nguoiThuHoi(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'nguoi_thu_hoi',
            'ma_tai_khoan'
        );
    }

    public function isActive(): bool
    {
        return $this->thoi_gian_thu_hoi === null;
    }
}
