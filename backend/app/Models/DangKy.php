<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DangKy extends Model
{
    use HasFactory;

    protected $table = 'dang_ky';

    protected $primaryKey = 'ma_dang_ky';

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'thoi_gian_dang_ky' => 'datetime',
            'thoi_gian_check_in' => 'datetime',
            'thoi_gian_check_out' => 'datetime',
            'thoi_gian_huy' => 'datetime',
            'da_check_in' => 'boolean',
            'da_check_out' => 'boolean',
            'nghi_van_gian_lan' => 'boolean',
            'tham_gia_tron_ven' => 'boolean',
            'tham_gia_mot_phan' => 'boolean',
            'ti_le_drl' => 'decimal:2',
            'da_feedback' => 'boolean',
            'han_an_han_feedback' => 'datetime',
            'du_dieu_kien_drl' => 'boolean',
            'vi_pham_no_show' => 'boolean',
            'da_gui_nhac_nho' => 'boolean',
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

    public function feedback(): HasOne
    {
        return $this->hasOne(DanhGiaFeedback::class, 'ma_dang_ky', 'ma_dang_ky');
    }

    public function chungNhan(): HasOne
    {
        return $this->hasOne(ChungNhan::class, 'ma_dang_ky', 'ma_dang_ky');
    }
}
