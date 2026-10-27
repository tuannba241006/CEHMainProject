<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DangKyTamThoi extends Model
{
    use HasFactory;

    protected $table = 'dang_ky_tam_thoi';

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'dong_y_nghi_dinh_13' => 'boolean',
            'het_han_otp' => 'datetime',
            'cua_so_gui_otp_tu' => 'datetime',
            'thoi_gian_tao' => 'datetime',
            'so_lan_nhap_sai' => 'integer',
            'so_lan_gui_otp' => 'integer',
        ];
    }

    public function khoa(): BelongsTo
    {
        return $this->belongsTo(DonViToChuc::class, 'ma_khoa', 'ma_don_vi_to_chuc');
    }
}
