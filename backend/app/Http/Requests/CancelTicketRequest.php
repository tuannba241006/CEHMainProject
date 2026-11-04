<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CancelTicketRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ly_do_huy' => ['required', 'string', 'min:3', 'max:255'],
        ];
    }

    /**
     * Custom messages for validation errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ly_do_huy.required' => 'Lý do hủy vé là bắt buộc.',
            'ly_do_huy.min' => 'Lý do hủy vé phải có ít nhất 3 ký tự.',
            'ly_do_huy.max' => 'Lý do hủy vé không được vượt quá 255 ký tự.',
        ];
    }
}
