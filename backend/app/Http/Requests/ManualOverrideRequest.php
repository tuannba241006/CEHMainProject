<?php

namespace App\Http\Requests;

use Closure;
use Illuminate\Foundation\Http\FormRequest;

class ManualOverrideRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $allowedRates = $this->input('trang_thai_moi') === 'DaCheckOut' ? [0.5, 1.0] : [0.0];

        return [
            'ma_dang_ky' => ['required', 'integer', 'min:1'],
            'trang_thai_moi' => ['required', 'in:DaCheckIn,DaCheckOut'],
            'ti_le_drl_moi' => ['bail', 'required', 'numeric', function (string $attribute, mixed $value, Closure $fail) use ($allowedRates): void {
                if (! in_array((float) $value, $allowedRates, true)) {
                    $fail('Tỷ lệ ĐRL không hợp lệ với trạng thái điểm danh đã chọn.');
                }
            }],
            'xoa_no_show' => ['sometimes', 'boolean'],
            'ly_do' => ['required', 'string', 'min:10', 'max:1000'],
        ];
    }
}
