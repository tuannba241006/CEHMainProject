<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DonViToChuc extends Model
{
    use HasFactory;

    protected $table = 'don_vi_to_chuc';

    protected $primaryKey = 'ma_don_vi_to_chuc';

    const CREATED_AT = 'thoi_gian_tao';

    const UPDATED_AT = 'thoi_gian_cap_nhat';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'hoat_dong' => 'boolean',
            'thoi_gian_tao' => 'datetime',
            'thoi_gian_cap_nhat' => 'datetime',
        ];
    }

    public function donViCha(): BelongsTo
    {
        return $this->belongsTo(DonViToChuc::class, 'ma_don_vi_cha', 'ma_don_vi_to_chuc');
    }

    public function donViCon(): HasMany
    {
        return $this->hasMany(DonViToChuc::class, 'ma_don_vi_cha', 'ma_don_vi_to_chuc');
    }

    public function thanhVien(): HasMany
    {
        return $this->hasMany(User::class, 'ma_don_vi_to_chuc', 'ma_don_vi_to_chuc');
    }

    public function suKiens(): HasMany
    {
        return $this->hasMany(SuKien::class, 'ma_don_vi_to_chuc', 'ma_don_vi_to_chuc');
    }
}
