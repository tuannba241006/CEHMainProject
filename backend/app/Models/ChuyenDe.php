<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChuyenDe extends Model
{
    use HasFactory;

    protected $table = 'chuyen_de';

    protected $primaryKey = 'ma_chuyen_de';

    const CREATED_AT = 'thoi_gian_tao';

    const UPDATED_AT = 'thoi_gian_cap_nhat';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'da_xoa' => 'boolean',
            'thoi_gian_tao' => 'datetime',
            'thoi_gian_cap_nhat' => 'datetime',
        ];
    }

    public function suKiens(): HasMany
    {
        return $this->hasMany(SuKien::class, 'ma_chuyen_de', 'ma_chuyen_de');
    }
}
