<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NoShowViolatorResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'mssv' => (string) $this->mssv,
            'ho_ten' => (string) $this->ho_ten,
            'khoa' => (string) $this->khoa,
            'so_lan_vi_pham' => (int) $this->so_lan_vi_pham,
        ];
    }
}
