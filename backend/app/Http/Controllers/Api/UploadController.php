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
        $request->validate([
            'file' => 'required|image|max:5120',
            'loai' => 'nullable|in:poster,logo,avatar,banner',
        ]);

        $loai = $request->input('loai', 'poster');
        $path = $request->file('file')->store("uploads/{$loai}", 'public');
        $url = Storage::url($path);

        return $this->successResponse(['url' => $url], 'Tải ảnh thành công.', 201);
    }
}
