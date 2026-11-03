<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EventFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        // API khám phá sự kiện cho phép khách truy cập.
        return true;
    }

    protected function prepareForValidation(): void
    {
        // Chuyển "true"/"false" từ URL thành boolean.
        $normalized = [];

        foreach (['con_cho', 'khong_gioi_han_slot'] as $field) {
            $value = $this->query($field);

            if (is_string($value)) {
                $value = strtolower($value);

                if (in_array($value, ['true', 'false'], true)) {
                    $normalized[$field] = $value === 'true';
                }
            }
        }

        $this->merge($normalized);
    }

    public function rules(): array
    {
        return [
            'q' => [
                'sometimes', 'nullable', 'string', 'max:200'
            ],

            'ma_chuyen_de' => [
                'sometimes', 'integer', 'min:1'
            ],

            'ma_don_vi_to_chuc' => [
                'sometimes', 'integer', 'min:1'
            ],

            'trang_thai' => [
                'sometimes',
                Rule::in([
                    'PUBLISHED',
                    'HAPPENING',
                    'COMPLETED'
                ])
            ],

            'dieu_khoan_drl' => [
                'sometimes',
                Rule::in(['KhongCo', 'Dieu3', 'Dieu4'])
            ],

            'khong_gioi_han_slot' => [
                'sometimes', 'boolean'
            ],

            'con_cho' => [
                'sometimes', 'boolean'
            ],

            'tu_ngay' => [
                'sometimes', 'date_format:Y-m-d'
            ],

            'den_ngay' => array_merge(
                ['sometimes', 'date_format:Y-m-d'],
                $this->filled('tu_ngay')
                    ? ['after_or_equal:tu_ngay']
                    : []
            ),

            'sort' => [
                'sometimes',
                Rule::in([
                    'bat_dau_asc',
                    'bat_dau_desc',
                    'moi_cong_bo'
                ])
            ],

            'page' => [
                'sometimes', 'integer', 'min:1'
            ],

            'limit' => [
                'sometimes', 'integer',
                'min:1', 'max:100'
            ]
        ];
    }
}
