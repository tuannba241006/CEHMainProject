<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cảnh Báo Vi Phạm Vắng Mặt (No-Show)</title>
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
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
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
            background-color: #fef2f2;
            border: 1px solid #fecaca;
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
            <h1>Cảnh Báo Vi Phạm Vắng Mặt</h1>
        </div>
        <div class="content">
            <div class="greeting">Xin chào {{ $recipientName }},</div>
            <div class="message">
                Hệ thống Campus Event Hub ghi nhận bạn đã đăng ký tham gia sự kiện nhưng không có mặt điểm danh và không thực hiện hủy vé trước thời hạn quy định (T-4h).
            </div>
            <div class="info-card">
                <div class="info-item"><strong>Sự kiện:</strong> {{ $eventName }}</div>
                <div class="info-item"><strong>Thời gian bắt đầu:</strong> {{ $eventStartTime }}</div>
                <div class="info-item"><strong>Mã vé:</strong> {{ $ticketUuid }}</div>
                <div class="info-item" style="color: #b91c1c;"><strong>Trạng thái:</strong> Vi phạm No-show (Vắng mặt không phép)</div>
            </div>
            <div class="message">
                Theo quy chế của Phòng Công tác Sinh viên (P.CTSV), các vi phạm No-show lặp lại có thể dẫn đến việc tạm khóa quyền đăng ký sự kiện hoặc xem xét chế tài Điểm rèn luyện cuối học kỳ. Nếu bạn có lý do chính đáng hoặc sự cố kỹ thuật, vui lòng liên hệ Ban tổ chức sự kiện để được hỗ trợ giải quyết.
            </div>
        </div>
        <div class="footer">
            Đây là email tự động từ Hệ thống Quản trị Sự kiện Campus Event Hub (CEH). Vui lòng không trả lời trực tiếp email này.
        </div>
    </div>
</body>
</html>

