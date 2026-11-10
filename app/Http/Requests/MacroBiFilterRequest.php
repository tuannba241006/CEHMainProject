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
        if ($this->is('api/v1/admin/analytics/no-show-violations') || $this->is('api/admin/analytics/no-show-violations')) {
            $this->merge([
                'so_lan_toi_thieu' => $this->input('so_lan_toi_thieu', 3),
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
