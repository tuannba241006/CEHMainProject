<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ManualOverrideRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ma_dang_ky' => ['required', 'integer', 'min:1'],
            'trang_thai_moi' => ['required', 'in:DaCheckIn,DaCheckOut'],
            'ti_le_drl_moi' => ['required', 'numeric', 'in:0,0.5,1'],
            'xoa_no_show' => ['sometimes', 'boolean'],
            'ly_do' => ['required', 'string', 'min:10', 'max:1000'],
        ];
    }
}
