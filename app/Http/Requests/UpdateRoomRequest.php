<?php

namespace App\Http\Requests;

use App\Enums\Campus;
use App\Enums\RoomStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'ten_phong' => ['sometimes', 'string', 'max:255'],
            'co_so' => ['sometimes', Rule::enum(Campus::class)],
            'suc_chua_toi_da' => ['sometimes', 'integer', 'min:10'],
            'trang_thiet_bi' => ['sometimes', 'array'],
            'trang_thai' => ['sometimes', Rule::enum(RoomStatus::class)],

            // Conditional khi trang_thai = BaoTri
            'bao_tri_tu_ngay' => ['required_if:trang_thai,BaoTri', 'nullable', 'date'],
            'bao_tri_den_ngay' => ['required_if:trang_thai,BaoTri', 'nullable', 'date', 'after:bao_tri_tu_ngay'],
            'ly_do_bao_tri' => ['required_if:trang_thai,BaoTri', 'nullable', 'string', 'min:10'],
        ];
    }

    public function messages(): array
    {
        return [
            'suc_chua_toi_da.min' => 'Sức chứa tối đa phải từ 10 chỗ trở lên.',
            'bao_tri_tu_ngay.required_if' => 'Thời gian bắt đầu bảo trì không được để trống khi phòng bảo trì.',
            'bao_tri_den_ngay.required_if' => 'Thời gian kết thúc bảo trì không được để trống khi phòng bảo trì.',
            'bao_tri_den_ngay.after' => 'Thời gian kết thúc bảo trì phải sau thời gian bắt đầu.',
            'ly_do_bao_tri.required_if' => 'Lý do bảo trì không được để trống khi chuyển sang trạng thái bảo trì.',
            'ly_do_bao_tri.min' => 'Lý do bảo trì phải có tối thiểu 10 ký tự.',
        ];
    }
}
