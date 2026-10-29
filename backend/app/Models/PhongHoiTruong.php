<?php

namespace App\Models;

use App\Models\Scopes\ChuaXoaScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PhongHoiTruong extends Model
{
    use HasFactory;

    protected $table = 'phong_hoi_truong';

    protected $primaryKey = 'ma_phong';

    const CREATED_AT = 'thoi_gian_tao';

    const UPDATED_AT = 'thoi_gian_cap_nhat';

    protected $guarded = [];

    protected static function booted(): void
    {
        static::addGlobalScope(new ChuaXoaScope());
    }

    protected function casts(): array
    {
        return [
            'suc_chua_toi_da' => 'integer',
            'trang_thiet_bi' => 'array',
            'da_xoa' => 'boolean',
            'bao_tri_tu_ngay' => 'datetime',
            'bao_tri_den_ngay' => 'datetime',
            'thoi_gian_tao' => 'datetime',
            'thoi_gian_cap_nhat' => 'datetime',
        ];
    }

    public function suKiens(): HasMany
    {
        return $this->hasMany(SuKien::class, 'ma_phong', 'ma_phong');
    }

    public function datPhongs(): HasMany
    {
        return $this->hasMany(DatPhong::class, 'ma_phong', 'ma_phong');
    }
}
