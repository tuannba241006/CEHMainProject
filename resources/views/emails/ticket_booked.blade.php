<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vé Điện Tử Tham Dự Sự Kiện</title>
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
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
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
        .qr-box {
            text-align: center;
            background-color: #eef2ff;
            border: 1px dashed #6366f1;
            border-radius: 12px;
            padding: 20px 16px;
            margin-bottom: 20px;
        }
        .qr-payload {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            color: #334155;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 8px 10px;
            word-break: break-all;
            margin-top: 12px;
        }
        .warning-card {
            background-color: #fefce8;
            border: 1px solid #fef08a;
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 20px;
            font-size: 13px;
            color: #854d0e;
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
        }
        .footer {
            border-top: 1px solid #e2e8f0;
            padding: 16px 24px;
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
            <h1>Xác Nhận Vé Điện Tử Thành Công</h1>
        </div>
        <div class="content">
            <div class="greeting">Xin chào {{ $recipientName }}@if($mssv) ({{ $mssv }})@endif,</div>
            <div class="message">
                Hệ thống Campus Event Hub đã phát hành vé điện tử chính thức kèm chữ ký số HMAC-SHA256 cho bạn. Vui lòng lưu giữ mã vé và xuất trình mã QR khi làm thủ tục Check-in.
            </div>

            <div class="info-card">
                <div class="info-item"><strong>Sự kiện:</strong> {{ $eventName }}</div>
                <div class="info-item"><strong>Bắt đầu:</strong> {{ $eventStartTime }}</div>
                <div class="info-item"><strong>Kết thúc:</strong> {{ $eventEndTime }}</div>
                <div class="info-item"><strong>Địa điểm:</strong> {{ $roomName }}</div>
                <div class="info-item"><strong>Mã vé UUID:</strong> <code>{{ $ticketUuid }}</code></div>
            </div>

            <div class="qr-box">
                <div style="font-size: 13px; font-weight: 700; color: #312e81; margin-bottom: 12px;">
                    MÃ QR CHECK-IN ĐIỆN TỬ (CEH1 HMAC-SHA256)
                </div>
                <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data={{ urlencode($payloadQr) }}"
                    alt="QR Code Check-in"
                    width="180"
                    height="180"
                    style="border-radius: 8px; border: 4px solid #ffffff; background: #ffffff;"
                >
                <div class="qr-payload">
                    {{ $payloadQr }}
                </div>
            </div>

            <div class="warning-card">
                <strong>Quy định hủy vé (Mốc T-4h):</strong><br>
                Nếu bạn không thể tham dự, vui lòng hủy vé trong mục <strong>Vé của tôi</strong> trước <strong>{{ $cancelDeadline }}</strong> (trước giờ khai mạc ít nhất 4 tiếng) để nhường suất cho danh sách chờ và tránh bị ghi nhận No-show.
            </div>

            <div style="text-align: center;">
                <a href="{{ $ticketsUrl }}" class="action-button">Mở Ví Vé Của Tôi</a>
            </div>
        </div>
        <div class="footer">
            Email tự động từ Hệ thống Campus Event Hub (CEH). Vui lòng không trả lời email này.
        </div>
    </div>
</body>
</html>

