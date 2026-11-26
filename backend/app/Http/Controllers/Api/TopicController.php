<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChuyenDe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TopicController extends Controller
{
    /**
     * GET /api/admin/topics  (Admin only)
     */
    public function index(Request $request): JsonResponse
    {
        $query = ChuyenDe::query();

        if (! $request->boolean('include_deleted', false)) {
            $query->where('da_xoa', false);
        }

        if ($request->filled('q')) {
            $q = trim((string) $request->input('q'));
            $query->where('ten_chuyen_de', 'like', "%{$q}%");
        }

        $topics = $query->orderBy('ma_chuyen_de', 'asc')->paginate(15);

        return $this->successResponse($topics);
    }

    /**
     * POST /api/admin/topics  (Admin only)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ten_chuyen_de' => 'required|string|max:255|unique:chuyen_de,ten_chuyen_de',
            'mo_ta' => 'nullable|string',
        ]);

        $topic = ChuyenDe::create($validated + ['da_xoa' => false]);

        return $this->successResponse($topic, 'Tạo chuyên đề thành công.', 201);
    }

    /**
     * PUT /api/admin/topics/{id}  (Admin only)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $topic = ChuyenDe::findOrFail($id);

        $validated = $request->validate([
            'ten_chuyen_de' => 'sometimes|string|max:255|unique:chuyen_de,ten_chuyen_de,'.$id.',ma_chuyen_de',
            'mo_ta' => 'nullable|string',
        ]);

        $topic->update($validated);

        return $this->successResponse($topic, 'Cập nhật chuyên đề thành công.');
    }

    /**
     * DELETE /api/admin/topics/{id}  (Admin only)
     */
    public function destroy(int $id): JsonResponse
    {
        $topic = ChuyenDe::findOrFail($id);

        // Soft-delete via da_xoa flag (matches schema)
        $topic->update(['da_xoa' => true]);

        return $this->successResponse(null, 'Xóa chuyên đề thành công.');
    }
}
