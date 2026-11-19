<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class MacroBiFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('hoc_ky')) {
            $hocKy = $this->input('hoc_ky');
            $year = now()->year;
            $dates = match ($hocKy) {
                'HK1' => ['tu_ngay' => "{$year}-08-01", 'den_ngay' => now()->toDateString()],
                'HK2' => ['tu_ngay' => "{$year}-01-01", 'den_ngay' => "{$year}-06-30"],
                '30DAYS' => ['tu_ngay' => now()->subDays(30)->toDateString(), 'den_ngay' => now()->toDateString()],
                '90DAYS' => ['tu_ngay' => now()->subDays(90)->toDateString(), 'den_ngay' => now()->toDateString()],
                'ALL' => ['tu_ngay' => '2020-01-01', 'den_ngay' => now()->toDateString()],
                default => null,
            };
            if ($dates) {
                $this->merge([
                    'tu_ngay' => $this->input('tu_ngay', $dates['tu_ngay']),
                    'den_ngay' => $this->input('den_ngay', $dates['den_ngay']),
                ]);
            }
        }

        if ($this->is('api/v1/admin/analytics/no-show-violations') || $this->is('api/admin/analytics/no-show-violations')) {
            $this->merge([
                'so_lan_toi_thieu' => $this->input('so_lan_toi_thieu', 1),
                'page' => $this->input('page', 1),
                'limit' => $this->input('limit', 20),
            ]);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'hoc_ky' => ['sometimes', 'string', 'in:HK1,HK2,30DAYS,90DAYS,ALL'],
            'tu_ngay' => ['sometimes', 'date'],
            'den_ngay' => ['sometimes', 'date', 'after_or_equal:tu_ngay'],
            'ma_khoa' => ['sometimes', 'integer', 'min:1'],
            'so_lan_toi_thieu' => ['sometimes', 'integer', 'min:1'],
            'q' => ['sometimes', 'string', 'max:150'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
