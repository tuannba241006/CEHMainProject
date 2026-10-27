<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OtpQuenMatKhau extends Model
{
    use HasFactory;

    protected $table = 'otp_quen_mat_khau';

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'da_su_dung' => 'boolean',
            'het_han' => 'datetime',
            'thoi_gian_tao' => 'datetime',
            'so_lan_thu_sai' => 'integer',
        ];
    }

    public function taiKhoan(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ma_tai_khoan', 'ma_tai_khoan');
    }
}
