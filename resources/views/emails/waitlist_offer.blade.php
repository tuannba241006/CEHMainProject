<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Suất Nhận Vé Ưu Tiên Từ Danh Sách Chờ</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 32px auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }
        .header {
            background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
            padding: 28px 24px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
        }
        .content {
            padding: 28px 24px;
        }
        .greeting {
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 12px;
        }
        .message {
            font-size: 14px;
            line-height: 1.6;
            color: #475569;
            margin-bottom: 20px;
        }
        .countdown-box {
            background-color: #fffbeb;
            border: 1px solid #fcd34d;
            border-radius: 12px;
            padding: 16px;
            text-align: center;
            margin-bottom: 20px;
        }
        .countdown-value {
            font-size: 22px;
            font-weight: 700;
            color: #b45309;
        }
        .info-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 20px;
        }
        .info-item {
            margin-bottom: 8px;
            font-size: 13px;
            line-height: 1.5;
        }
        .info-item:last-child {
            margin-bottom: 0;
        }
        .action-button {
            display: inline-block;
            background-color: #4f46e5;
            color: #ffffff !important;
            font-weight: 600;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
        }
        .footer {
            padding: 16px 24px;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 12px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Suất Nhận Vé Ưu Tiên Đã Sẵn Sàng</h1>
        </div>
        <div class="content">
            <div class="greeting">Chào {{ $recipientName }},</div>
            <p class="message">
                Có một suất trống vừa được giải phóng cho sự kiện <strong>{{ $eventName }}</strong> và bạn đang đứng đầu hàng đợi FIFO.
            </p>
            <div class="countdown-box">
                <div class="countdown-value">Còn {{ $minutesRemaining }} phút để xác nhận</div>
                <div style="font-size: 13px; color: #92400e; margin-top: 4px;">
                    Hạn chót giữ chỗ: <strong>{{ $offerDeadline }} (+07:00)</strong>
                </div>
            </div>
            <div class="info-card">
                <div class="info-item"><strong>Sự kiện:</strong> {{ $eventName }}</div>
                <div class="info-item"><strong>Thời gian:</strong> {{ $eventStartTime }}</div>
                <div class="info-item"><strong>Địa điểm:</strong> {{ $roomName }}</div>
            </div>
            <p class="message">
                Nếu quá hạn xác nhận hoặc phát hiện trùng lịch sự kiện giới hạn slot khác, suất vé sẽ tự động chuyển cho sinh viên kế tiếp.
            </p>
            <div style="text-align: center;">
                <a href="{{ $waitlistUrl }}" class="action-button">Mở Danh sách chờ &amp; Nhận vé</a>
            </div>
        </div>
        <div class="footer">
            Campus Event Hub — Trường Đại học Công nghệ Thông tin (UIT)
        </div>
    </div>
</body>
</html>

