<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ho_ten' => ['required', 'string', 'min:2', 'max:150'],
            'mssv' => ['required', 'string', 'regex:/^[0-9]{8}$/'],
            'email' => ['required', 'string', 'email:rfc,dns', 'max:100', 'regex:/^[0-9]{8}@gm\.uit\.edu\.vn$/'],
            'mat_khau' => ['required', 'string', 'min:8', 'max:72'],
            'xac_nhan_mat_khau' => ['required', 'string', 'same:mat_khau'],
            'dong_y_nghi_dinh_13' => ['required', 'accepted'],
            'so_dien_thoai' => ['nullable', 'string', 'regex:/^0[0-9]{9}$/'],
            'lop_sinh_hoat' => ['nullable', 'string', 'max:50'],
            'ma_khoa' => ['nullable', 'integer', 'exists:don_vi_to_chuc,ma_don_vi_to_chuc'],
        ];
    }

    public function messages(): array
    {
        return [
            'ho_ten.required' => 'Họ và tên không được để trống.',
            'ho_ten.min' => 'Họ và tên phải có tối thiểu 2 ký tự.',
            'ho_ten.max' => 'Họ và tên không được vượt quá 150 ký tự.',
            'mssv.required' => 'Mã số sinh viên không được để trống.',
            'mssv.regex' => 'Mã số sinh viên phải bao gồm đúng 8 chữ số.',
            'email.required' => 'Email sinh viên không được để trống.',
            'email.regex' => 'Email phải là định dạng email trường hợp lệ (ví dụ: 22520001@gm.uit.edu.vn).',
            'mat_khau.required' => 'Mật khẩu không được để trống.',
            'mat_khau.min' => 'Mật khẩu phải có tối thiểu 8 ký tự.',
            'mat_khau.max' => 'Mật khẩu không được vượt quá 72 ký tự.',
            'xac_nhan_mat_khau.required' => 'Xác nhận mật khẩu không được để trống.',
            'xac_nhan_mat_khau.same' => 'Mật khẩu xác nhận không trùng khớp.',
            'dong_y_nghi_dinh_13.accepted' => 'ND13_CONSENT_REQUIRED: Bạn bắt buộc phải đồng ý với điều khoản thu thập và xử lý dữ liệu theo Nghị định 13/2023/NĐ-CP.',
            'dong_y_nghi_dinh_13.required' => 'ND13_CONSENT_REQUIRED: Bạn bắt buộc phải đồng ý với điều khoản thu thập và xử lý dữ liệu theo Nghị định 13/2023/NĐ-CP.',
            'so_dien_thoai.regex' => 'Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số.',
            'ma_khoa.exists' => 'Khoa trực thuộc không tồn tại trong hệ thống.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $email = $this->input('email');
            $mssv = $this->input('mssv');

            // 1. Core invariant: email prefix must strictly match mssv
            if ($email && $mssv) {
                $emailPrefix = explode('@', $email)[0];
                if ($emailPrefix !== $mssv) {
                    $validator->errors()->add(
                        'mssv',
                        'MSSV_EMAIL_MISMATCH: MSSV không trùng khớp với định danh địa chỉ email trường của bạn.'
                    );
                }
            }

            // 2. Uniqueness check against existing active users
            if ($email && User::where('email', $email)->exists()) {
                $validator->errors()->add(
                    'email',
                    'EMAIL_ALREADY_EXISTS: Địa chỉ email này đã được sử dụng trên hệ thống.'
                );
            }

            if ($mssv && User::where('mssv', $mssv)->exists()) {
                $validator->errors()->add(
                    'mssv',
                    'MSSV_ALREADY_EXISTS: Mã số sinh viên này đã được đăng ký tài khoản.'
                );
            }
        });
    }
}
