<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class RespondCoHostRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user && ($user->isAdmin() || $user->isToChuc());
    }

    public function rules(): array
    {
        return [
            'trang_thai_xac_nhan' => ['required', 'string', Rule::in(['DONG_Y', 'TU_CHOI'])],
            'ghi_chu_tu_choi' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'trang_thai_xac_nhan.required' => 'Trạng thái xác nhận không được để trống.',
            'trang_thai_xac_nhan.in' => 'Trạng thái xác nhận phải là DONG_Y hoặc TU_CHOI.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $status = $this->input('trang_thai_xac_nhan');
            $note = $this->input('ghi_chu_tu_choi');

            if ($status === 'TU_CHOI') {
                if (empty($note) || mb_strlen(trim((string) $note)) < 5) {
                    $v->errors()->add('ghi_chu_tu_choi', 'Lý do từ chối đồng tổ chức bắt buộc phải có ít nhất 5 ký tự.');
                }
            }
        });
    }
}
