<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChangeRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user && $user->isAdmin();
    }

    public function rules(): array
    {
        return [
            'ma_phong_moi' => ['required', 'integer', 'min:1', 'exists:phong_hoi_truong,ma_phong'],
            'ly_do' => ['required', 'string', 'min:5', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'ma_phong_moi.required' => 'Mã phòng mới là bắt buộc.',
            'ma_phong_moi.integer' => 'Mã phòng mới phải là số nguyên.',
            'ma_phong_moi.exists' => 'Phòng hội trường mới không tồn tại.',
            'ly_do.required' => 'Lý do điều chuyển phòng là bắt buộc.',
            'ly_do.string' => 'Lý do phải là chuỗi ký tự.',
            'ly_do.min' => 'Lý do phải có ít nhất :min ký tự.',
            'ly_do.max' => 'Lý do không được vượt quá :max ký tự.',
        ];
    }
}
