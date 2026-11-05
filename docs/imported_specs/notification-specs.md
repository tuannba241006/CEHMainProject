============================================================
16. DỮ LIỆU ĐỘNG — TÊN NGƯỜI DÙNG
============================================================

TUYỆT ĐỐI KHÔNG hard-code tên "Duy Anh".

Dòng chào:

"Xin chào, Duy Anh 👋"

phải lấy tên từ tài khoản hiện tại đang đăng nhập.

Sử dụng dữ liệu user hiện tại:

currentUser.name

Ví dụ:

Nếu tài khoản đăng nhập là:
Nguyễn Văn An

→ hiển thị:

"Xin chào, An 👋"

Nếu tài khoản là:
Trần Minh Anh

→ hiển thị:

"Xin chào, Anh 👋"

Nếu tài khoản là:
Cao Duy Anh

→ hiển thị:

"Xin chào, Duy Anh 👋"

Không hiển thị MSSV thay cho tên.

Không hard-code "Duy Anh".

Tên hiển thị phải được đồng bộ với:

- Hồ sơ cá nhân
- Avatar
- Tài khoản đăng nhập
- Thông tin người dùng hiện tại

Avatar cũng phải lấy chữ cái từ tên người dùng.

Ví dụ:

Cao Duy Anh → DA

Nguyễn Minh Anh → MA

Trần Văn Nam → TN

Nếu người dùng đã upload avatar cá nhân:
→ ưu tiên hiển thị ảnh avatar.

Nếu chưa có avatar:
→ hiển thị initials.

============================================================
17. THÔNG BÁO — NOTIFICATION CENTER
============================================================

Icon 🔔 trên Header KHÔNG phải icon trang trí.

Nó phải là một Notification Center có trạng thái:

- Có thông báo mới
- Không có thông báo mới

Khi có thông báo chưa đọc:

Hiển thị chấm đỏ nhỏ trên icon chuông.

Ví dụ:

🔔 • 

Khi không có thông báo chưa đọc:

🔔

Không để chấm đỏ quá lớn.

Không để chấm đỏ che icon.

============================================================
18. NỘI DUNG THÔNG BÁO
============================================================

Notification Center phải hỗ trợ thông báo liên quan đến hệ thống Campus Event Hub.

Đặc biệt phải có:

1. Sự kiện sắp diễn ra

Ví dụ:

"Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu sắp diễn ra"

"Ngày mai · 08:30"

"Trường Đại học Công nghệ Thông tin"

2. Sắp hết thời gian đăng ký

Ví dụ:

"Sự kiện sắp đóng đăng ký"

"Hội thảo Data Engineering sẽ đóng đăng ký lúc 23:59 hôm nay."

3. Đăng ký thành công

Ví dụ:

"Đăng ký sự kiện thành công"

"Bạn đã đăng ký Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu."

4. Vé sắp được sử dụng

Ví dụ:

"Nhắc nhở check-in"

"Sự kiện của bạn sẽ bắt đầu sau 2 giờ."

5. Sự kiện thay đổi thông tin

Ví dụ:

"Sự kiện đã cập nhật"

"Địa điểm của Hội thảo AI đã được thay đổi."

6. Sự kiện bị hủy

Ví dụ:

"Sự kiện đã bị hủy"

"Sự kiện Workshop Data Engineering ngày 20/10 đã bị hủy."

============================================================
19. NOTIFICATION DROPDOWN / PANEL
============================================================

Khi người dùng click icon 🔔:

Desktop:
→ mở Notification Popover ở góc phải phía trên.

Mobile:
→ mở Notification Bottom Sheet hoặc màn hình Notification.

Không được để panel nằm dưới Dynamic Island.

Panel phải nằm trong safe area.

Header của notification:

"Thông báo"

Bên phải:

"Đánh dấu tất cả đã đọc"

Bên dưới có thể chia:

[Mới]

[Trước đó]

============================================================
20. NOTIFICATION ITEM
============================================================

Mỗi notification có:

- Icon loại thông báo
- Tiêu đề
- Nội dung ngắn
- Thời gian
- Trạng thái đã đọc / chưa đọc

Ví dụ:

┌─────────────────────────────────────┐
│ 🔔  Sự kiện sắp diễn ra             │
│     Ngày hội nghề nghiệp AI         │
│     Ngày mai · 08:30                │
│     ●                               │
└─────────────────────────────────────┘

Notification chưa đọc:

- background hơi nổi bật
- có chấm nhỏ
- font title đậm hơn

Notification đã đọc:

- background bình thường
- không có chấm đỏ

============================================================
21. CLICK NOTIFICATION
============================================================

Notification phải có interaction.

Ví dụ:

Click:

"Sự kiện sắp diễn ra"

→ mở STU-02:
"Chi tiết sự kiện & Đăng ký"

Click:

"Đăng ký thành công"

→ mở STU-03:
"Vé QR"

Click:

"Nhắc nhở check-in"

→ mở STU-04:
"Vé của tôi"

Click:

"Sự kiện đã cập nhật"

→ mở STU-02.

============================================================
22. NOTIFICATION BADGE
============================================================

Badge phải là dữ liệu động.

Ví dụ có 3 thông báo chưa đọc:

🔔 [3]

Có 1:

🔔 [1]

Không có:

🔔

Không hard-code số lượng.

Sử dụng:

unreadNotificationCount

Badge chỉ xuất hiện khi:

unreadNotificationCount > 0

============================================================
23. DỮ LIỆU DEMO
============================================================

Tạo dữ liệu demo để giao diện có thể trình diễn.

Current user:

name:
"Cao Duy Anh"

displayName:
"Duy Anh"

studentId:
"2352xxxx"

faculty:
"Công nghệ Thông tin"

email:
"2352xxxx@gm.uit.edu.vn"

avatar:
null

→ UI hiển thị:

"Xin chào, Duy Anh 👋"

Avatar:

"DA"

Notification demo:

1.
title:
"Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu sắp diễn ra"

description:
"Sự kiện sẽ diễn ra ngày mai lúc 08:30."

time:
"10 phút trước"

status:
"unread"

2.
title:
"Đăng ký thành công"

description:
"Bạn đã đăng ký Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu."

time:
"Hôm qua"

status:
"read"

3.
title:
"Nhắc nhở check-in"

description:
"Sự kiện của bạn sẽ bắt đầu sau 2 giờ."

time:
"2 giờ trước"

status:
"unread"

============================================================
24. PROFILE PHẢI ĐỒNG BỘ VỚI CURRENT USER
============================================================

Khi người dùng mở:

"Hồ sơ cá nhân"

phải sử dụng cùng dữ liệu:

currentUser

Không tạo dữ liệu Profile riêng biệt.

Profile:

Avatar
Tên
MSSV
Khoa / Viện
Email
Số điện thoại

Nếu người dùng thay đổi:

Tên hiển thị

hoặc

Avatar

thì Header phải cập nhật theo.

Ví dụ:

Profile đổi avatar
→ Header đổi avatar.

Profile đổi tên:
"Cao Duy Anh"

thành:

"Cao Duy"

→ Header:

"Xin chào, Duy 👋"

Avatar initials cũng cập nhật:

DA → D

============================================================
25. AVATAR UPLOAD
============================================================

Trong STU-05:

Avatar phải có nút chỉnh sửa nhỏ.

Ví dụ:

[ Avatar ]
    ✎

Khi click:

"Thay đổi ảnh đại diện"

Cho phép:

- Chọn ảnh
- Xem preview
- Hủy
- Lưu

Sau khi lưu:

Avatar mới phải xuất hiện đồng thời ở:

- Profile
- Header
- Notification panel nếu có user avatar
- Các khu vực cần hiển thị user

Không dùng avatar cố định.

============================================================
26. UX HEADER CUỐI CÙNG
============================================================

Mobile Header:

SAFE AREA

Xin chào, {currentUser.displayName} 👋

Khám phá sự kiện

                           🔔
                           DA

Search

[Tìm kiếm sự kiện, diễn giả...] [Bộ lọc]

Filter horizontal scroll

[Tất cả] [Học thuật] [Kỹ năng] [Văn nghệ] [Thể thao] [Cộng đồng]

Filter trạng thái

[Còn chỗ] [Sắp hết] [Hết chỗ]

Không có thành phần nào được hard-code sai dữ liệu người dùng.

Không để Dynamic Island che Header.

Không để Notification badge che icon.

Không để filter bị cắt.

Không để filter tự xuống dòng.

============================================================
27. QUAN TRỌNG — TƯƠNG TÁC THỰC TẾ
============================================================

Hãy tạo prototype interactions cho:

- Đăng nhập demo
- Hiển thị tên currentUser
- Click avatar → mở Profile
- Click notification → mở Notification Center
- Click notification item → mở đúng sự kiện/vé
- Đánh dấu thông báo đã đọc
- Filter horizontal scrolling
- Chọn filter
- Search
- Click event card → STU-02
- Click "Đăng ký ngay" → STU-03
- Click "Xem trong Vé của tôi" → STU-04
- Click avatar edit → chỉnh avatar
- Bottom navigation → chuyển giữa:
  Khám phá
  Vé của tôi
  Hồ sơ

Prototype phải thể hiện được flow của một ứng dụng thật, không chỉ là các màn hình tĩnh.