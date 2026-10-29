<?php

namespace App\Http\Requests;

use App\Enums\Campus;
use App\Enums\RoomStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'ten_phong' => [
                'required',
                'string',
                'max:100',
                Rule::unique('phong_hoi_truong', 'ten_phong')
                    ->where('co_so', $this->input('co_so')),
            ],
            'co_so' => ['required', Rule::enum(Campus::class)],
            'suc_chua_toi_da' => ['required', 'integer', 'min:10'],
            'trang_thiet_bi' => ['required', 'array'],
            'trang_thai' => ['sometimes', Rule::enum(RoomStatus::class)],
        ];
    }

    public function messages(): array
    {
        return [
            'ten_phong.required' => 'Tên phòng không được để trống.',
            'co_so.required' => 'Cơ sở không được để trống.',
            'suc_chua_toi_da.required' => 'Sức chứa tối đa không được để trống.',
            'suc_chua_toi_da.min' => 'Sức chứa tối đa phải từ 10 chỗ trở lên.',
            'trang_thiet_bi.required' => 'Trang thiết bị không được để trống.',
            'trang_thiet_bi.array' => 'Trang thiết bị phải là định dạng mảng/đối tượng JSON.',
        ];
    }
}
