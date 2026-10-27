<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PhienKiosk extends Model
{
    use HasFactory;

    protected $table = 'phien_kiosk';

    protected $primaryKey = 'ma_phien_kiosk';

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'thoi_gian_bat_dau' => 'datetime',
            'thoi_gian_het_han' => 'datetime',
            'da_thu_hoi' => 'boolean',
            'thoi_gian_thu_hoi' => 'datetime',
        ];
    }

    public function suKien(): BelongsTo
    {
        return $this->belongsTo(SuKien::class, 'ma_su_kien', 'ma_su_kien');
    }

    public function nguoiKichHoat(): BelongsTo
    {
        return $this->belongsTo(User::class, 'nguoi_kich_hoat', 'ma_tai_khoan');
    }
}
