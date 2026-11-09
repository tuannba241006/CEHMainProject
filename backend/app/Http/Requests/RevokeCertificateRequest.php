<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RevokeCertificateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ly_do_thu_hoi' => ['required_without:ly_do', 'nullable', 'string', 'min:5', 'max:500'],
            'ly_do' => ['required_without:ly_do_thu_hoi', 'nullable', 'string', 'min:5', 'max:500'],
        ];
    }

    public function getReason(): string
    {
        return (string) ($this->input('ly_do_thu_hoi') ?? $this->input('ly_do'));
    }

    public function messages(): array
    {
        return [
            'ly_do_thu_hoi.required_without' => 'Lý do thu hồi là bắt buộc.',
            'ly_do_thu_hoi.min' => 'Lý do thu hồi phải có ít nhất 5 ký tự.',
            'ly_do_thu_hoi.max' => 'Lý do thu hồi không được vượt quá 500 ký tự.',
            'ly_do.required_without' => 'Lý do thu hồi là bắt buộc.',
            'ly_do.min' => 'Lý do thu hồi phải có ít nhất 5 ký tự.',
            'ly_do.max' => 'Lý do thu hồi không được vượt quá 500 ký tự.',
        ];
    }
}
