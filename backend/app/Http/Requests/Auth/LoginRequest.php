<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ten_dang_nhap' => ['required', 'string', 'max:100'],
            'mat_khau' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'ten_dang_nhap.required' => 'Vui lòng nhập Mã số sinh viên hoặc Email.',
            'mat_khau.required' => 'Vui lòng nhập mật khẩu.',
        ];
    }
}
