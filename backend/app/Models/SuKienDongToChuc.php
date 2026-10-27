<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SuKienDongToChuc extends Model
{
    use HasFactory;

    protected $table = 'su_kien_dong_to_chuc';

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'thoi_gian_phan_hoi' => 'datetime',
            'thoi_gian_tao' => 'datetime',
        ];
    }

    public function suKien(): BelongsTo
    {
        return $this->belongsTo(SuKien::class, 'ma_su_kien', 'ma_su_kien');
    }

    public function donViToChuc(): BelongsTo
    {
        return $this->belongsTo(DonViToChuc::class, 'ma_don_vi_to_chuc', 'ma_don_vi_to_chuc');
    }
}
