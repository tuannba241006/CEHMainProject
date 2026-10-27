<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DanhGiaFeedback extends Model
{
    use HasFactory;

    protected $table = 'danh_gia_feedback';

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'diem_noi_dung' => 'integer',
            'diem_dien_gia' => 'integer',
            'diem_to_chuc' => 'integer',
            'thoi_gian_gui' => 'datetime',
        ];
    }

    public function dangKy(): BelongsTo
    {
        return $this->belongsTo(DangKy::class, 'ma_dang_ky', 'ma_dang_ky');
    }

    public function suKien(): BelongsTo
    {
        return $this->belongsTo(SuKien::class, 'ma_su_kien', 'ma_su_kien');
    }
}
