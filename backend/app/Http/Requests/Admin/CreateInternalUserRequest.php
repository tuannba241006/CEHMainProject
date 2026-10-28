<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class CreateInternalUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'ho_ten' => ['required', 'string', 'min:2', 'max:150'],
            'email' => ['required', 'string', 'email:rfc,dns', 'max:100', 'regex:/@uit\.edu\.vn$/', 'unique:tai_khoan,email'],
            'loai_tai_khoan' => ['required', 'string', 'in:ToChuc,Admin'],
            'ma_don_vi_to_chuc' => ['required_if:loai_tai_khoan,ToChuc', 'nullable', 'integer', 'exists:don_vi_to_chuc,ma_don_vi_to_chuc'],
            'so_dien_thoai' => ['nullable', 'string', 'regex:/^0[0-9]{9}$/'],
            'mat_khau' => ['nullable', 'string', 'min:8', 'max:72'],
        ];
    }

    public function messages(): array
    {
        return [
            'ho_ten.required' => 'Họ và tên cán bộ không được để trống.',
            'ho_ten.min' => 'Họ và tên phải có tối thiểu 2 ký tự.',
            'email.required' => 'Email công vụ không được để trống.',
            'email.regex' => 'Email cán bộ nội bộ bắt buộc phải có đuôi trường @uit.edu.vn.',
            'email.unique' => 'Địa chỉ email này đã tồn tại trên hệ thống.',
            'loai_tai_khoan.required' => 'Loại tài khoản không được để trống.',
            'loai_tai_khoan.in' => 'Loại tài khoản nội bộ chỉ có thể là ToChuc hoặc Admin.',
            'ma_don_vi_to_chuc.required_if' => 'Tài khoản Ban tổ chức bắt buộc phải gán với một Đơn vị tổ chức trực thuộc.',
            'ma_don_vi_to_chuc.exists' => 'Đơn vị tổ chức được chọn không tồn tại.',
            'so_dien_thoai.regex' => 'Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số.',
            'mat_khau.min' => 'Mật khẩu khởi tạo phải có tối thiểu 8 ký tự.',
        ];
    }
}
