<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ThongBao extends Model
{
    use HasFactory;

    protected $table = 'thong_bao';

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'da_doc' => 'boolean',
            'thoi_gian_gui' => 'datetime',
        ];
    }

    public function taiKhoan(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ma_tai_khoan', 'ma_tai_khoan');
    }
}
