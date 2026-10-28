<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'mat_khau_hien_tai' => ['required', 'string'],
            'mat_khau_moi' => ['required', 'string', 'min:8', 'max:72', 'different:mat_khau_hien_tai'],
            'xac_nhan_mat_khau_moi' => ['required', 'string', 'same:mat_khau_moi'],
        ];
    }

    public function messages(): array
    {
        return [
            'mat_khau_hien_tai.required' => 'Vui lòng nhập mật khẩu hiện tại.',
            'mat_khau_moi.required' => 'Vui lòng nhập mật khẩu mới.',
            'mat_khau_moi.min' => 'Mật khẩu mới phải có tối thiểu 8 ký tự.',
            'mat_khau_moi.max' => 'Mật khẩu mới không được vượt quá 72 ký tự.',
            'mat_khau_moi.different' => 'Mật khẩu mới không được trùng với mật khẩu hiện tại.',
            'xac_nhan_mat_khau_moi.required' => 'Vui lòng xác nhận mật khẩu mới.',
            'xac_nhan_mat_khau_moi.same' => 'Xác nhận mật khẩu mới không trùng khớp.',
        ];
    }
}
