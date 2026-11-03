<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>{{ $event->ten_su_kien }} | Campus Event Hub</title>

    <meta name="description" content="{{ $description }}">

    <!-- OpenGraph SSR: Facebook, Zalo -->
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Campus Event Hub">
    <meta property="og:title" content="{{ $event->ten_su_kien }}">
    <meta property="og:description" content="{{ $description }}">
    <meta property="og:image" content="{{ $imageUrl }}">
    <meta property="og:url" content="{{ $shareUrl }}">

    <!-- Twitter / X -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ $event->ten_su_kien }}">
    <meta name="twitter:description" content="{{ $description }}">
    <meta name="twitter:image" content="{{ $imageUrl }}">

    <link rel="canonical" href="{{ $shareUrl }}">
</head>
<body>
    <main>
        <h1>{{ $event->ten_su_kien }}</h1>

        <p>{{ $description }}</p>

        <p>
            Bắt đầu:
            {{ $event->thoi_gian_bat_dau->copy()
                ->setTimezone('Asia/Ho_Chi_Minh')
                ->format('d/m/Y H:i') }}
        </p>

        <p>
            Kết thúc:
            {{ $event->thoi_gian_ket_thuc->copy()
                ->setTimezone('Asia/Ho_Chi_Minh')
                ->format('d/m/Y H:i') }}
        </p>
    </main>
</body>
</html>
