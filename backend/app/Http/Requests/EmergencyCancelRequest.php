<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EmergencyCancelRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user && ($user->isAdmin() || $user->isToChuc());
    }

    public function rules(): array
    {
        return [
            'ly_do_huy' => ['required', 'string', 'min:5', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'ly_do_huy.required' => 'Lý do hủy sự kiện khẩn cấp là bắt buộc.',
            'ly_do_huy.string' => 'Lý do hủy sự kiện phải là chuỗi ký tự.',
            'ly_do_huy.min' => 'Lý do hủy sự kiện phải có ít nhất :min ký tự.',
            'ly_do_huy.max' => 'Lý do hủy sự kiện không được vượt quá :max ký tự.',
        ];
    }
}
