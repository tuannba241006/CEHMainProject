<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HangDoiWaitlist extends Model
{
    use HasFactory;

    protected $table = 'hang_doi_waitlist';

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'so_thu_tu' => 'integer',
            'thoi_gian_dang_ky' => 'datetime',
            'thoi_gian_chuyen_trang_thai' => 'datetime',
            'han_chot_xac_nhan' => 'datetime',
        ];
    }

    public function suKien(): BelongsTo
    {
        return $this->belongsTo(SuKien::class, 'ma_su_kien', 'ma_su_kien');
    }

    public function taiKhoan(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ma_tai_khoan', 'ma_tai_khoan');
    }
}
