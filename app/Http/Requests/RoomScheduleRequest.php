<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RoomScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user && ($user->isAdmin() || $user->isToChuc());
    }

    public function rules(): array
    {
        return [
            'tu_ngay' => ['required', 'date'],
            'den_ngay' => ['required', 'date', 'after_or_equal:tu_ngay'],
        ];
    }

    public function messages(): array
    {
        return [
            'tu_ngay.required' => 'Từ ngày không được để trống.',
            'den_ngay.required' => 'Đến ngày không được để trống.',
            'den_ngay.after_or_equal' => 'Đến ngày phải sau hoặc cùng ngày với Từ ngày.',
        ];
    }
}
