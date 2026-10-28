<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:100'],
            'reset_token' => ['required', 'string'],
            'mat_khau_moi' => ['required', 'string', 'min:8', 'max:72'],
            'xac_nhan_mat_khau_moi' => ['required', 'string', 'same:mat_khau_moi'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'Email không được để trống.',
            'reset_token.required' => 'Token xác thực không được để trống.',
            'mat_khau_moi.required' => 'Vui lòng nhập mật khẩu mới.',
            'mat_khau_moi.min' => 'Mật khẩu mới phải có tối thiểu 8 ký tự.',
            'mat_khau_moi.max' => 'Mật khẩu mới không được vượt quá 72 ký tự.',
            'xac_nhan_mat_khau_moi.required' => 'Vui lòng xác nhận mật khẩu mới.',
            'xac_nhan_mat_khau_moi.same' => 'Xác nhận mật khẩu mới không trùng khớp.',
        ];
    }
}
