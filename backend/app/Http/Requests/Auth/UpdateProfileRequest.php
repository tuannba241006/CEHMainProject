<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ho_ten' => ['sometimes', 'required', 'string', 'min:2', 'max:150'],
            'so_dien_thoai' => ['nullable', 'string', 'regex:/^0[0-9]{9}$/'],
            'lop_sinh_hoat' => ['nullable', 'string', 'max:50'],
            'ma_khoa' => ['nullable', 'integer', 'exists:don_vi_to_chuc,ma_don_vi_to_chuc'],
            'avatar_url' => ['nullable', 'string', 'max:500', 'url'],
        ];
    }

    public function messages(): array
    {
        return [
            'ho_ten.required' => 'Họ và tên không được để trống.',
            'ho_ten.min' => 'Họ và tên phải có tối thiểu 2 ký tự.',
            'ho_ten.max' => 'Họ và tên không được vượt quá 150 ký tự.',
            'so_dien_thoai.regex' => 'Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số.',
            'ma_khoa.exists' => 'Khoa trực thuộc không tồn tại trong hệ thống.',
            'avatar_url.url' => 'Ảnh đại diện phải là một URL hợp lệ.',
        ];
    }
}
