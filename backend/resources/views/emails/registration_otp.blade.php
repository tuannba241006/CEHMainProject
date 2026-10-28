<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mã OTP Xác Thực Đăng Ký</title>
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
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
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
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.025em;
        }
        .header p {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
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
        .otp-box {
            background-color: #f1f5f9;
            border: 2px dashed #4f46e5;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin: 24px 0;
        }
        .otp-code {
            font-family: 'Courier New', monospace;
            font-size: 36px;
            font-weight: 800;
            letter-spacing: 8px;
            color: #4f46e5;
            display: inline-block;
        }
        .otp-expiry {
            font-size: 13px;
            color: #64748b;
            margin-top: 8px;
        }
        .warning-box {
            background-color: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 12px 16px;
            border-radius: 4px;
            font-size: 13px;
            color: #991b1b;
            margin-bottom: 24px;
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
            <h1>Campus Event Hub</h1>
            <p>Nền tảng Quản lý & Đăng ký Sự kiện Sinh viên UIT</p>
        </div>
        <div class="content">
            <div class="greeting">Xin chào {{ $hoTen }},</div>
            <div class="message">
                Cảm ơn bạn đã đăng ký tài khoản tại <strong>Campus Event Hub</strong>. Để hoàn tất kích hoạt tài khoản sinh viên của bạn, vui lòng nhập mã OTP xác thực bên dưới:
            </div>
            <div class="otp-box">
                <div class="otp-code">{{ $otp }}</div>
                <div class="otp-expiry">Mã có hiệu lực trong vòng <strong>10 phút</strong></div>
            </div>
            <div class="warning-box">
                ⚠️ <strong>Lưu ý bảo mật:</strong> Tuyệt đối không chia sẻ mã này cho bất kỳ ai. Ban quản trị Campus Event Hub không bao giờ yêu cầu bạn cung cấp mã OTP.
            </div>
            <div class="message">
                Nếu bạn không thực hiện yêu cầu đăng ký này, vui lòng bỏ qua email này.
            </div>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Campus Event Hub - Trường ĐH Công nghệ Thông tin (UIT - VNU-HCM).<br>
            Email này được gửi tự động, vui lòng không phản hồi.
        </div>
    </div>
</body>
</html>
