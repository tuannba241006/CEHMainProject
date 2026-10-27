<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChungNhan extends Model
{
    use HasFactory;

    protected $table = 'chung_nhan';

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'ngay_cap' => 'datetime',
            'da_thu_hoi' => 'boolean',
            'thoi_gian_thu_hoi' => 'datetime',
        ];
    }

    public function dangKy(): BelongsTo
    {
        return $this->belongsTo(DangKy::class, 'ma_dang_ky', 'ma_dang_ky');
    }

    public function nguoiThuHoi(): BelongsTo
    {
        return $this->belongsTo(User::class, 'nguoi_thu_hoi', 'ma_tai_khoan');
    }
}
