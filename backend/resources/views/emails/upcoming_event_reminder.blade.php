<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nhắc Hẹn Sự Kiện Sắp Diễn Ra</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 580px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }
        .header {
            background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
            padding: 32px 24px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 700;
        }
        .content {
            padding: 32px 24px;
        }
        .greeting {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        .message {
            font-size: 14px;
            line-height: 1.6;
            color: #475569;
            margin-bottom: 24px;
        }
        .info-card {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
        }
        .info-item {
            margin-bottom: 8px;
            font-size: 14px;
        }
        .info-item:last-child {
            margin-bottom: 0;
        }
        .warning-card {
            background-color: #fefce8;
            border: 1px solid #fef08a;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
            font-size: 13px;
            color: #854d0e;
            line-height: 1.5;
        }
        .danger-card {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
            font-size: 13px;
            color: #991b1b;
            line-height: 1.5;
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
            margin-top: 8px;
        }
        .footer {
            border-top: 1px solid #e2e8f0;
            padding: 20px 24px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            background-color: #f8fafc;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Nhắc Hẹn Sự Kiện Sắp Diễn Ra</h1>
        </div>
        <div class="content">
            <div class="greeting">Xin chào {{ $recipientName }},</div>
            <div class="message">
                Sự kiện bạn đã đăng ký tham gia trên Campus Event Hub sẽ chính thức diễn ra trong vòng 24 giờ tới. Vui lòng kiểm tra lại thông tin chi tiết dưới đây:
            </div>
            <div class="info-card">
                <div class="info-item"><strong>Sự kiện:</strong> {{ $eventName }}</div>
                <div class="info-item"><strong>Thời gian bắt đầu:</strong> {{ $eventStartTime }}</div>
                <div class="info-item"><strong>Địa điểm / Phòng:</strong> {{ $roomName }}</div>
                <div class="info-item"><strong>Mã vé cá nhân:</strong> {{ $ticketUuid }}</div>
            </div>

            @if($canCancel)
            <div class="warning-card">
                <strong>Lưu ý hạn chót hủy vé (T-4h):</strong><br>
                Nếu bạn bận và không thể tham dự, vui lòng hủy vé trước <strong>{{ $cancelDeadline }}</strong> (ít nhất 4 giờ trước khi sự kiện bắt đầu) để nhường cơ hội cho các sinh viên trong danh sách chờ và tránh bị ghi nhận vi phạm No-show.
            </div>
            @else
            <div class="danger-card">
                <strong>Thông báo hết hạn hủy vé:</strong><br>
                Đã qua mốc thời hạn tự hủy vé (trước 4 giờ). Bạn không còn quyền tự hủy vé trên hệ thống. Vui lòng có mặt đúng giờ để check-in và tránh bị chế tài No-show.
            </div>
            @endif

            <div style="text-align: center; margin: 24px 0;">
                <p style="font-size: 14px; color: #64748b; margin-bottom: 12px;">Xuất trình vé hoặc quét mã QR tại bàn đón tiếp khi đến hội trường:</p>
                <a href="{{ config('app.url') }}/tickets/{{ $ticketId }}" class="action-button">Xem Vé & QR Code Của Bạn</a>
            </div>
        </div>
        <div class="footer">
            Đây là email tự động từ Hệ thống Campus Event Hub (CEH). Vui lòng không trả lời trực tiếp email này.
        </div>
    </div>
</body>
</html>

