<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DatPhong extends Model
{
    use HasFactory;

    protected $table = 'dat_phong';

    protected $primaryKey = 'ma_dat_phong';

    const CREATED_AT = 'thoi_gian_tao';

    const UPDATED_AT = 'thoi_gian_cap_nhat';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'thoi_gian_bat_dau' => 'datetime',
            'thoi_gian_ket_thuc' => 'datetime',
            'han_giu_cho_tam' => 'datetime',
            'co_pending' => 'integer',
            'co_confirmed' => 'integer',
            'thoi_gian_tao' => 'datetime',
            'thoi_gian_cap_nhat' => 'datetime',
        ];
    }

    public function phongHoiTruong(): BelongsTo
    {
        return $this->belongsTo(PhongHoiTruong::class, 'ma_phong', 'ma_phong');
    }

    public function suKien(): BelongsTo
    {
        return $this->belongsTo(SuKien::class, 'ma_su_kien', 'ma_su_kien');
    }
}
