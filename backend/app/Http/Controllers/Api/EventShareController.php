<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SuKien;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class EventShareController extends Controller
{
    public function show(Request $request, int $id): Response
    {
        // Chi chia se su kien cong khai.
        $event = SuKien::query()
            ->where('ma_su_kien', $id)
            ->whereIn('trang_thai', [
                'PUBLISHED',
                'HAPPENING',
                'COMPLETED',
            ])
            ->firstOrFail();

        // Noi dung ngan gon va an toan cho OpenGraph.
        $description = trim(
            preg_replace(
                '/\s+/u',
                ' ',
                strip_tags((string) $event->mo_ta)
            )
        );

        if ($description === '') {
            $description = 'Khám phá sự kiện tại Campus Event Hub';
        }

        $description = Str::limit($description, 180);

        // Xu ly URL anh bia.
        $cover = trim((string) $event->anh_bia);

        if (preg_match('~^https?://~i', $cover)) {
            $imageUrl = $cover;
        } elseif (
            $cover !== ''
            && !preg_match('~^[a-z][a-z0-9+.-]*:~i', $cover)
            && !str_starts_with($cover, '//')
        ) {
            $imageUrl = url('/' . ltrim($cover, '/'));
        } else {
            // Anh mac dinh can duoc bo sung vao public/images.
            $imageUrl = asset('images/default-event-og.png');
        }

        $shareUrl = route('v1.events.public.share', [
            'id' => $event->ma_su_kien,
        ]);

        return response()->view('events.share', [
            'event' => $event,
            'description' => $description,
            'imageUrl' => $imageUrl,
            'shareUrl' => $shareUrl,
        ])->header('Content-Type', 'text/html; charset=UTF-8');
    }
}
