<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class DrlUnlockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ly_do' => ['required', 'string', 'min:10', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ly_do.required' => 'Vui lòng cung cấp lý do mở khóa điều chỉnh ĐRL.',
            'ly_do.min' => 'Lý do mở khóa phải có ít nhất 10 ký tự.',
            'ly_do.max' => 'Lý do mở khóa không được vượt quá 500 ký tự.',
        ];
    }
}
