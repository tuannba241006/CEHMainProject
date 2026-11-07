<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitFeedbackRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'diem_noi_dung' => ['required', 'integer', 'between:1,5'],
            'diem_dien_gia' => ['required', 'integer', 'between:1,5'],
            'diem_to_chuc' => ['required', 'integer', 'between:1,5'],
            'y_kien_dong_gop' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'diem_noi_dung.required' => 'Điểm nội dung là bắt buộc.',
            'diem_noi_dung.between' => 'Điểm nội dung phải từ 1 đến 5.',
            'diem_dien_gia.required' => 'Điểm diễn giả là bắt buộc.',
            'diem_dien_gia.between' => 'Điểm diễn giả phải từ 1 đến 5.',
            'diem_to_chuc.required' => 'Điểm tổ chức là bắt buộc.',
            'diem_to_chuc.between' => 'Điểm tổ chức phải từ 1 đến 5.',
            'y_kien_dong_gop.max' => 'Ý kiến đóng góp tối đa 2000 ký tự.',
        ];
    }
}
