<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FeedbackGraceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ly_do' => ['required', 'string', 'min:5', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'ly_do.required' => 'Lý do ân hạn là bắt buộc.',
            'ly_do.min' => 'Lý do ân hạn phải có ít nhất 5 ký tự.',
            'ly_do.max' => 'Lý do ân hạn không được vượt quá 500 ký tự.',
        ];
    }
}
