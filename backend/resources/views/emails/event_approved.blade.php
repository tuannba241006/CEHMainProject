<!DOCTYPE html>
<html lang="vi">
<body>
    <p>Xin chào {{ $recipientName }},</p>
    <p>Sự kiện <strong>{{ $eventTitle }}</strong> đã được <strong>{{ $approvalModeLabel }}</strong> phê duyệt chính thức và xác nhận đặt phòng.</p>
    <ul>
        <li><strong>Thời gian bắt đầu:</strong> {{ $startTimeLabel }}</li>
        <li><strong>Địa điểm:</strong> {{ $roomLabel }}</li>
    </ul>
    <p>Ban tổ chức có thể kiểm tra thông tin sự kiện trên hệ thống và chuẩn bị công bố đúng kế hoạch.</p>
    <p>Trân trọng,<br>Campus Event Hub</p>
</body>
</html>
