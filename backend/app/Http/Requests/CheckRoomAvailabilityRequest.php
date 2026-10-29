<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckRoomAvailabilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user && ($user->isAdmin() || $user->isToChuc());
    }

    protected function prepareForValidation(): void
    {
        $this->merge(array_merge($this->query(), $this->all()));
    }

    public function rules(): array
    {
        return [
            'thoi_gian_bat_dau' => ['required', 'date'],
            'thoi_gian_ket_thuc' => ['required', 'date', 'after:thoi_gian_bat_dau'],
            'exclude_event_id' => ['nullable', 'integer', 'exists:su_kien,ma_su_kien'],
        ];
    }

    public function messages(): array
    {
        return [
            'thoi_gian_bat_dau.required' => 'Thời gian bắt đầu không được để trống.',
            'thoi_gian_ket_thuc.required' => 'Thời gian kết thúc không được để trống.',
            'thoi_gian_ket_thuc.after' => 'Thời gian kết thúc phải sau thời gian bắt đầu.',
            'exclude_event_id.exists' => 'Sự kiện loại trừ không tồn tại trong hệ thống.',
        ];
    }
}
