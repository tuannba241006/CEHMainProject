<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ThongKeSuKienNgay extends Model
{
    use HasFactory;

    protected $table = 'thong_ke_su_kien_ngay';

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'ngay_thong_ke' => 'date',
            'tong_ve_phat_hanh' => 'integer',
            'tong_ve_dang_ky' => 'integer',
            'tong_luot_tham_du' => 'integer',
            'tong_luot_check_out' => 'integer',
            'tong_luot_no_show' => 'integer',
            'so_phut_chay_ve' => 'integer',
            'diem_hai_long_trung_binh' => 'decimal:2',
            'thoi_gian_cap_nhat' => 'datetime',
        ];
    }

    public function suKien(): BelongsTo
    {
        return $this->belongsTo(SuKien::class, 'ma_su_kien', 'ma_su_kien');
    }
}
