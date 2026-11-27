<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    /**
     * POST /api/uploads/images  (auth required)
     * POST /api/v1/uploads/images  (auth required)
     *
     * Body (multipart/form-data):
     *   file  — image file, max 5 MB
     *   loai  — poster|logo|avatar|banner  (optional, default: poster)
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $data = $request->validate([
            'file' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120', 'dimensions:max_width=4096,max_height=4096'],
            'loai' => ['nullable', 'in:poster,logo,avatar,banner'],
        ]);

        $loai = $data['loai'] ?? 'poster';
        $role = (string) $request->user()->loai_tai_khoan;
        if (! in_array($role, ['Admin', 'ToChuc', 'SinhVien'], true)
            || ($role === 'SinhVien' && $loai !== 'avatar')) {
            return $this->errorResponse('FORBIDDEN', 'Bạn không có quyền tải lên loại ảnh này.', null, 403);
        }

        $path = $request->file('file')->store("uploads/{$loai}", 'public');
        $url = Storage::url($path);

        return $this->successResponse(['url' => $url], 'Tải ảnh thành công.', 201);
    }
}
