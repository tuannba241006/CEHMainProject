URGENT — FULL SYSTEM AUDIT + BUSINESS LOGIC + STATE CONSISTENCY + MOBILE SAFE AREA FIX

Hãy rà soát và sửa TOÀN BỘ prototype hiện tại của hệ thống:

CAMPUS EVENT HUB

Đây không chỉ là yêu cầu sửa UI.

Hãy audit và đồng bộ toàn bộ:

- DATA
- APPLICATION STATE
- BUSINESS LOGIC
- USER FLOW
- NAVIGATION
- UI STATE
- EVENT REGISTRATION
- TICKET
- TICKET CANCELLATION
- QR
- CHECK-IN
- NOTIFICATION
- PROFILE
- ORGANIZER
- PARTICIPANT
- SEARCH
- FILTER
- RESPONSIVE
- MOBILE SAFE AREA

Mục tiêu cuối cùng:

Prototype phải hoạt động như một hệ thống quản lý sự kiện thật.

Không được chỉ làm giao diện “trông như hoạt động”.

Mọi thao tác của user phải thay đổi dữ liệu thật trong application state và tất cả màn hình liên quan phải phản ánh cùng một dữ liệu.

==================================================
1. SOURCE OF TRUTH / APPLICATION STATE
==================================================

Tạo một source of truth dùng chung cho toàn bộ application.

KHÔNG tạo dữ liệu riêng biệt cho từng màn hình.

Các màn hình:

- Event Explore
- Event Card
- Event Detail
- Registration Confirmation
- My Tickets
- Ticket Detail
- QR
- Profile
- Notification
- Organizer Dashboard
- Event Management
- Participant Management
- Staff Check-in
- Check-in History

phải đọc và cập nhật cùng một application state.

Nếu event thay đổi registeredCount:

→ Event Card
→ Event Detail
→ Explore
→ Organizer Dashboard
→ Participant List

phải cập nhật theo.

Nếu ticket thay đổi status:

→ My Tickets
→ Ticket Detail
→ QR
→ Event Detail
→ Participant List
→ Check-in

phải cập nhật theo.

Không được có duplicate state khiến các màn hình hiển thị dữ liệu khác nhau.

==================================================
2. DATA MODEL
==================================================

CURRENT USER

{
  id,
  studentId,
  name,
  displayName,
  faculty,
  email,
  phone,
  avatar
}

Demo current user:

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

phone:
"09xxxxxxxx"

avatar:
null

KHÔNG hard-code "Duy Anh" vào từng UI.

Header, Profile, Ticket, Notification và các màn hình khác phải lấy từ currentUser.

Nếu Profile thay đổi:

- name
- displayName
- email
- phone
- avatar

thì tất cả màn hình liên quan phải cập nhật ngay.

Avatar:

Nếu avatar = null:
→ hiển thị initials.

Nếu user upload avatar:
→ Header và Profile phải dùng cùng avatar.

Không tạo avatar riêng cho từng màn hình.


EVENT

{
  id,
  title,
  description,
  category,
  organizer,
  date,
  startTime,
  endTime,
  location,
  capacity,
  registeredCount,
  remainingSlots,
  registrationStatus,
  image,
  status
}

Không hard-code registeredCount và remainingSlots riêng trong UI.

Luôn đảm bảo:

remainingSlots = capacity - registeredCount


TICKET

{
  id,
  eventId,
  studentId,
  studentName,
  eventName,
  eventDate,
  eventTime,
  location,
  status,
  qrCode,
  createdAt,
  checkedInAt,
  cancelledAt
}


NOTIFICATION

{
  id,
  userId,
  type,
  title,
  message,
  eventId,
  ticketId,
  createdAt,
  read
}


CHECK-IN

{
  ticketId,
  eventId,
  studentId,
  checkedInAt,
  staffId,
  status
}

==================================================
3. EVENT DEMO DATA
==================================================

Sử dụng event demo:

id:
EVT-001

title:
Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu

capacity:
200

registeredCount:
180

remainingSlots:
20

registrationStatus:
open

status:
active

Ban đầu current user chưa đăng ký event này.

==================================================
4. DATA INVARIANTS
==================================================

Luôn đảm bảo:

registeredCount >= 0

registeredCount <= capacity

remainingSlots >= 0

remainingSlots = capacity - registeredCount

Một student chỉ có tối đa 1 ACTIVE ticket cho một event.

Ticket "Đã hủy":

→ không tính vào active participants.

Ticket "Đã check-in":

→ không được hủy.

Ticket "Đã hủy":

→ không được check-in.

Check-in:

→ KHÔNG thay đổi registeredCount.

Register:

→ chỉ tăng registeredCount đúng một lần.

Cancel:

→ chỉ giảm registeredCount đúng một lần.

Không được xảy ra trạng thái:

registeredCount = 181

nhưng UI hiển thị 180.

Hoặc:

remainingSlots = 0

nhưng button vẫn là "Đăng ký ngay".

==================================================
5. REGISTER EVENT — FULL LOGIC
==================================================

Khi user nhấn:

"Đăng ký ngay"

phải thực hiện transaction.

STEP 1 — Validate registrationStatus

Nếu:

registrationStatus != "open"

→ không cho đăng ký.

Hiển thị:

"Đã đóng đăng ký"

hoặc trạng thái phù hợp.

STEP 2 — Validate capacity

Nếu:

remainingSlots <= 0

→ không cho đăng ký.

Button:

"Hết chỗ"

disabled.

STEP 3 — Check duplicate registration

Tìm active ticket:

studentId = currentUser.studentId
AND
eventId = current event.id
AND
ticket.status != "Đã hủy"

Nếu đã tồn tại:

→ không tạo ticket mới
→ không tăng registeredCount
→ không giảm remainingSlots
→ không tạo notification duplicate
→ chuyển button thành:

"Xem vé"

STEP 4 — Create ticket

Nếu hợp lệ, tạo ticket mới.

Ví dụ:

{
  id: "TKT-2026-0001",
  eventId: "EVT-001",
  studentId: currentUser.studentId,
  studentName: currentUser.name,
  eventName: event.title,
  eventDate: event.date,
  eventTime: event.startTime,
  location: event.location,
  status: "Chưa check-in",
  qrCode: unique QR value,
  createdAt: current timestamp
}

STEP 5 — Update event

registeredCount:

180 → 181

remainingSlots:

20 → 19

STEP 6 — Update user/event relationship

userRegistered:

false → true

userTicketId:

null → TKT-2026-0001

STEP 7 — Add ticket to user's ticket collection

Ticket vừa tạo phải xuất hiện trong:

"Vé của tôi"

STEP 8 — Create notification

type:

registration_success

title:

"Đăng ký thành công"

message:

"Bạn đã đăng ký Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu."

eventId:

EVT-001

ticketId:

TKT-2026-0001

read:

false

STEP 9 — Registration confirmation

Hiển thị:

"Đăng ký thành công"

và QR của ĐÚNG ticket vừa tạo.

Không tạo QR giả.

QR ở Registration Confirmation phải giống QR trong My Tickets.

==================================================
6. AFTER REGISTER — UI MUST UPDATE IMMEDIATELY
==================================================

Không reload.

Event Detail:

180/200
→ 181/200

20 chỗ còn lại
→ 19 chỗ còn lại

Button:

"Đăng ký ngay"
→ "Xem vé"

Event Card cũng phải:

181/200
19 chỗ còn lại

My Tickets:

→ xuất hiện ticket mới.

Notification:

→ xuất hiện "Đăng ký thành công".

Organizer Dashboard:

→ registeredCount cập nhật.

Participant List:

→ participant mới xuất hiện.

Tất cả phải lấy cùng một state.

==================================================
7. REGISTRATION STATUS
==================================================

Tự động tính trạng thái chỗ trống.

Nếu:

remainingSlots <= 0

→ "Hết chỗ"

Nếu:

remainingSlots > 0
AND
remainingSlots / capacity <= 0.2

→ "Sắp hết"

Nếu:

remainingSlots / capacity > 0.2

→ "Còn chỗ"

Ví dụ:

20/200 = 10%
→ "Sắp hết"

19/200 = 9.5%
→ "Sắp hết"

0/200
→ "Hết chỗ"

Không hard-code trạng thái.

==================================================
8. TICKET — MY TICKETS
==================================================

"Vé của tôi" phải lấy dữ liệu từ ticket collection.

KHÔNG dùng static cards.

Mỗi ticket hiển thị:

- Tên sự kiện
- Ngày
- Giờ
- Địa điểm
- Ticket ID
- Status
- QR
- Action

Nếu:

status = "Chưa check-in"

hiển thị:

"Xem mã QR"
"Hủy vé"

Nếu:

status = "Đã check-in"

hiển thị:

"Xem mã QR"

KHÔNG hiển thị "Hủy vé".

Nếu:

status = "Đã hủy"

hiển thị:

"Đã hủy"

Không cho hủy lần nữa.

QR của ticket đã hủy không được coi là QR hợp lệ.

Có thể có filter:

Tất cả
Sắp diễn ra
Đã check-in
Đã hủy

==================================================
9. CANCEL TICKET — FULL LOGIC
==================================================

ĐÂY LÀ LOGIC BẮT BUỘC.

Khi user chọn ticket:

status = "Chưa check-in"

và nhấn:

"Hủy vé"

KHÔNG hủy ngay.

Hiển thị confirmation modal:

"Hủy vé tham gia?"

"Bạn có chắc muốn hủy vé này không?"

Buttons:

"Quay lại"
"Hủy vé"

Nếu:

"Quay lại"

→ không thay đổi dữ liệu.

Nếu:

"Hủy vé"

→ thực hiện transaction.

STEP 1:

Tìm ticket theo ticket.id.

STEP 2:

Validate status.

Nếu:

status = "Đã hủy"

→ không làm gì thêm.

Nếu:

status = "Đã check-in"

→ KHÔNG cho hủy.

Hiển thị:

"Vé đã được check-in và không thể hủy."

Nếu:

status = "Chưa check-in"

→ cho phép hủy.

STEP 3:

Update ticket:

status:

"Chưa check-in"
→ "Đã hủy"

cancelledAt:

current timestamp

STEP 4:

Update event:

registeredCount:

181 → 180

remainingSlots:

19 → 20

STEP 5:

Update user/event relationship:

userRegistered:

true → false

userTicketId:

TKT-2026-0001 → null

STEP 6:

KHÔNG xóa ticket khỏi state.

Ticket phải được giữ lại để lưu lịch sử.

status:

"Đã hủy"

STEP 7:

Create notification:

title:

"Đã hủy vé"

message:

"Bạn đã hủy vé tham gia Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu."

type:

registration_cancelled

eventId:

EVT-001

ticketId:

TKT-2026-0001

STEP 8:

Update UI ngay lập tức.

KHÔNG reload.

==================================================
10. AFTER CANCEL
==================================================

My Tickets:

ticket phải hiển thị:

"Đã hủy"

Event Detail:

181/200
→ 180/200

19 remaining
→ 20 remaining

Nếu event vẫn open:

"Xem vé"
→ "Đăng ký ngay"

Nếu event đã đóng:

→ không cho đăng ký lại.

Event Card:

badge:

"Đã đăng ký"

phải biến mất ngay.

Organizer Dashboard:

181
→ 180

Participant List:

participant bị hủy phải biến mất khỏi active participants.

Notification:

"Đã hủy vé"

==================================================
11. CANCEL MUST NOT DUPLICATE
==================================================

Nếu user double-click "Hủy vé":

Chỉ được:

181 → 180

KHÔNG được:

181 → 179

remainingSlots:

19 → 20

KHÔNG được:

19 → 21

Ticket chỉ được:

"Chưa check-in"
→ "Đã hủy"

một lần.

==================================================
12. RE-REGISTER AFTER CANCEL
==================================================

Nếu:

ticket cũ = "Đã hủy"

AND

event.registrationStatus = "open"

AND

remainingSlots > 0

→ user được phép đăng ký lại.

Khi đăng ký lại:

PHẢI TẠO TICKET MỚI.

Không reuse ticket cũ.

Ví dụ:

Ticket cũ:

TKT-2026-0001
→ Đã hủy

Ticket mới:

TKT-2026-0002
→ Chưa check-in

Event:

180 → 181

Remaining:

20 → 19

userTicketId:

→ TKT-2026-0002

Không được có 2 ACTIVE ticket cùng lúc.

==================================================
13. QR CODE
==================================================

Mỗi active ticket phải có QR duy nhất.

QR phải reference:

ticketId
eventId
studentId

Staff scan QR phải tìm đúng ticket.

Nếu ticket.status = "Đã hủy":

→ QR invalid.

Hiển thị:

"Vé đã bị hủy và không thể check-in."

Nếu ticket không tồn tại:

"Không tìm thấy vé"

Nếu ticket không thuộc event:

"Vé không thuộc sự kiện này"

Nếu ticket.status = "Đã check-in":

"Vé đã được check-in"

Không check-in lần 2.

==================================================
14. STAFF CHECK-IN
==================================================

Khi Staff scan QR:

STEP 1:
Find ticket.

STEP 2:
Validate ticket tồn tại.

STEP 3:
Validate eventId.

STEP 4:
Validate status.

Nếu:

"Chưa check-in"

→ Check-in thành công.

Update:

ticket.status:

"Chưa check-in"
→ "Đã check-in"

checkedInAt:

current timestamp

Create check-in record.

Hiển thị:

"Check-in thành công"

Nếu scan lại:

→ "Vé đã được check-in"

Không tạo duplicate check-in.

Nếu ticket:

"Đã hủy"

→

"Vé đã bị hủy và không thể check-in."

==================================================
15. CHECK-IN KHÔNG ĐƯỢC THAY ĐỔI SLOT
==================================================

Check-in chỉ thay đổi ticket status.

KHÔNG:

- tăng registeredCount
- giảm registeredCount
- thay đổi remainingSlots

Ví dụ:

181 registered
19 remaining

sau check-in:

181 registered
19 remaining

Chỉ:

"Chưa check-in"
→ "Đã check-in"

==================================================
16. EVENT DETAIL STATE
==================================================

Event Detail phải xác định trạng thái bằng DATA THẬT.

CASE 1:

Chưa đăng ký
+
còn chỗ

→ "Đăng ký ngay"

CASE 2:

Có active ticket

→ "Xem vé"

CASE 3:

Ticket đã hủy
+
event còn mở

→ "Đăng ký ngay"

CASE 4:

remainingSlots = 0

→ "Hết chỗ"

CASE 5:

registrationStatus != open

→ "Đã đóng đăng ký"

CASE 6:

event đã kết thúc

→ "Sự kiện đã kết thúc"

Không để nhiều trạng thái mâu thuẫn cùng lúc.

==================================================
17. EVENT CARD / EXPLORE
==================================================

Event Card phải lấy data từ event state.

Hiển thị:

registeredCount
capacity
remainingSlots
registrationStatus

Nếu active ticket:

→ badge "Đã đăng ký"

Nếu user hủy:

→ badge "Đã đăng ký" biến mất ngay.

Nếu event full:

→ button "Hết chỗ"

Không hiển thị dữ liệu static.

==================================================
18. SEARCH + FILTER
==================================================

Search:

"Tìm kiếm sự kiện, diễn giả..."

phải tìm trên event data thật.

Filter:

- Chủ đề
- Trạng thái
- Ngày
- Địa điểm

phải thực sự filter danh sách.

"Có bộ lọc":

→ mở filter bottom sheet trên mobile.

Có:

- Chủ đề
- Trạng thái
- Ngày
- Địa điểm
- "Xóa bộ lọc"
- "Áp dụng"

"Xóa bộ lọc":

→ reset tất cả.

"Áp dụng":

→ cập nhật event list.

==================================================
19. HORIZONTAL FILTER CHIPS
==================================================

Các chip:

Tất cả
Học thuật
Kỹ năng
Văn nghệ
Thể thao
Cộng đồng

phải là horizontal scroll container thực sự.

Yêu cầu:

- Auto Layout ngang
- no wrap
- no shrink
- chip hug contents
- text không bị cắt
- touch/swipe được trên mobile
- kéo trái/phải được
- không clip text
- selected state thật
- click chip phải filter event thật

Không tạo một hàng chip static chỉ để nhìn giống scroll.

Có thể có subtle fade ở mép phải để gợi ý còn nội dung.

Nếu có nhiều nhóm filter, mỗi nhóm có thể có horizontal scroll riêng.

==================================================
20. NOTIFICATION CENTER
==================================================

Notification phải dùng data thật.

Các type:

1. registration_success
2. registration_cancelled
3. upcoming_event
4. checkin_reminder
5. registration_closing
6. event_updated
7. event_cancelled

Notification:

{
  id,
  userId,
  type,
  title,
  message,
  eventId,
  ticketId,
  createdAt,
  read
}

Click notification:

Nếu có eventId:

→ Event Detail

Nếu có ticketId:

→ Ticket Detail / QR

Khi mở:

read:

false → true

Unread badge phải cập nhật.

Notification icon phải là interactive.

Không phải icon trang trí.

Demo notification:

1.
"Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu sắp diễn ra"
"Sự kiện sẽ diễn ra ngày mai lúc 08:30."

2.
"Đăng ký thành công"
"Bạn đã đăng ký Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu."

3.
"Nhắc nhở check-in"
"Sự kiện của bạn sẽ bắt đầu sau 2 giờ."

==================================================
21. PROFILE
==================================================

Profile sử dụng currentUser.

Cho phép:

- sửa họ tên
- sửa email
- sửa số điện thoại
- sửa avatar

Sau Save:

Header cập nhật ngay.

Avatar cập nhật ngay.

Tên hiển thị cập nhật ngay.

Ticket studentName sử dụng currentUser data.

Không cần reload.

==================================================
22. ORGANIZER DASHBOARD
==================================================

Organizer Dashboard sử dụng cùng event state.

Nếu:

registeredCount:

180 → 181

Dashboard phải cập nhật:

- Tổng số người đăng ký
- Tỷ lệ lấp đầy
- Số chỗ còn lại

Nếu cancel:

181 → 180

Dashboard giảm tương ứng.

Không dùng static numbers.

==================================================
23. PARTICIPANT LIST
==================================================

Participant List phải lấy từ ACTIVE tickets.

Ticket:

"Chưa check-in"

→ participant active.

Ticket:

"Đã check-in"

→ participant active.

Ticket:

"Đã hủy"

→ KHÔNG phải active participant.

Ví dụ:

180 active participants

1 người hủy

→ 179 active participants.

Không hiển thị người đã hủy trong active participant list.

==================================================
24. ORGANIZER EVENT EDIT
==================================================

Nếu Organizer thay đổi capacity:

phải validate:

capacity >= registeredCount

Ví dụ:

registeredCount = 181

Không cho:

capacity = 150

Nếu capacity tăng:

remainingSlots tăng.

Nếu capacity giảm:

remainingSlots giảm.

Luôn:

remainingSlots = capacity - registeredCount

==================================================
25. EVENT UPDATE
==================================================

Nếu Organizer sửa:

- title
- date
- time
- location
- description

Event Detail và Ticket phải hiển thị thông tin nhất quán.

Không được:

Event Detail = location mới

nhưng Ticket = location cũ.

Ticket có thể giữ reference eventId và hiển thị event data hiện tại.

Tạo notification:

"Sự kiện đã được cập nhật"

cho những user đã đăng ký.

==================================================
26. EVENT CANCELLATION
==================================================

Nếu Organizer hủy event:

event.status:

"cancelled"

registrationStatus:

"closed"

Không cho đăng ký mới.

Các active tickets của event:

"Chưa check-in"
→ "Sự kiện đã hủy"

Không xóa ticket.

Không cho check-in.

Tạo notification:

"Sự kiện đã bị hủy"

cho tất cả user đã đăng ký.

Không cho tạo ticket mới cho event đã hủy.

==================================================
27. PERSISTENCE
==================================================

State phải được giữ khi navigate giữa các screen.

Flow:

Explore
→ Event Detail
→ Register
→ Registration Confirmation
→ QR
→ My Tickets
→ Explore

registeredCount vẫn phải:

181

remainingSlots:

19

Nếu hủy:

My Tickets
→ Cancel
→ Explore

phải:

180 registered
20 remaining

Không reset về initial state chỉ vì navigation.

Nếu Figma Make hỗ trợ persistent state phù hợp, sử dụng nó.

==================================================
28. ATOMIC TRANSACTION
==================================================

REGISTER phải được xử lý như một transaction:

validate
→ create ticket
→ update event count
→ update user/event relationship
→ create notification
→ update UI

CANCEL:

validate
→ update ticket status
→ update event count
→ update user/event relationship
→ create notification
→ update UI

Nếu một transaction thất bại:

Không để application ở trạng thái nửa chừng.

Không được:

ticket đã tạo

nhưng registeredCount chưa tăng.

Hoặc:

ticket đã hủy

nhưng remainingSlots chưa tăng.

==================================================
29. DOUBLE CLICK PROTECTION
==================================================

Đặc biệt:

"Đăng ký ngay"

và

"Hủy vé"

phải chống double click.

Double click Register:

→ chỉ tạo 1 ticket.

Double click Cancel:

→ chỉ cancel 1 lần.

Không duplicate notification.

Không duplicate ticket.

Không double increment/decrement count.

==================================================
30. MOBILE SAFE AREA — CRITICAL
==================================================

ĐÂY LÀ LỖI ĐANG XUẤT HIỆN TRONG PROTOTYPE.

Screenshot hiện tại cho thấy Dynamic Island / camera cutout đang CHE TRỰC TIẾP nội dung:

"Hồ sơ cá nhân"

Đây là lỗi layout structure.

KHÔNG chỉ thêm một margin nhỏ.

KHÔNG chỉ nói "support safe area".

PHẢI sửa underlying mobile layout architecture.

==================================================
31. MOBILE TOP SAFE AREA
==================================================

Đối với mobile viewport:

390 × 844
414 × 896
430 × 932

hãy dành riêng một vùng SAFE AREA thực sự ở phía trên.

Minimum:

88px

Nếu môi trường hỗ trợ:

env(safe-area-inset-top)

có thể dùng:

topSafeArea = max(env(safe-area-inset-top), 88px)

Nếu env(safe-area-inset-top) không hoạt động:

→ vẫn phải reserve cố định ít nhất 88px.

KHÔNG dùng chỉ:

20px
24px
32px
44px
50px

vì prototype hiện tại vẫn đang bị Dynamic Island che.

==================================================
32. SAFE AREA PHẢI LÀ REAL LAYOUT REGION
==================================================

Không được chỉ thêm padding ngẫu nhiên cho một title.

Cấu trúc mobile phải giống:

MobileViewport

├── TopSafeArea
│   └── min-height: 88px
│
└── AppContent
    ├── Header
    ├── PageTitle
    ├── MainContent
    └── BottomNavigation

TopSafeArea phải chiếm REAL vertical space.

Nó phải đẩy toàn bộ application content xuống dưới.

==================================================
33. ABSOLUTE / FIXED HEADER
==================================================

KHÔNG được:

position: absolute;
top: 0;

cho mobile header.

KHÔNG đặt header ở:

top: 0
top: 20
top: 30
top: 40
top: 50

Header phải nằm BELOW TopSafeArea.

Nếu sticky header:

top:

88px

NOT:

0px

Audit tất cả element sử dụng:

position: absolute
position: fixed

đặc biệt:

- Header
- Notification
- Floating buttons
- Modal
- QR scanner controls
- Bottom navigation

Không element nào được nằm trong Dynamic Island zone.

==================================================
34. PROFILE SCREEN — FIX FIRST
==================================================

Màn hình:

"Hồ sơ cá nhân"

hiện đang bị Dynamic Island che.

Phải chuyển toàn bộ content xuống.

Layout:

Top of viewport
↓
88px Top Safe Area
↓
Profile Header
"Hồ sơ cá nhân"
↓
Avatar
↓
"Cao Duy Anh"
↓
Student information
↓
Edit Profile
↓
Other settings

Target:

"Hồ sơ cá nhân"

phải bắt đầu khoảng:

y >= 100px

trên mobile prototype.

KHÔNG được để title ở khoảng:

y = 40–50px.

Không chỉ di chuyển riêng title.

Toàn bộ profile layout phải được đặt sau TopSafeArea.

==================================================
35. APPLY SAFE AREA TO ALL MOBILE SCREENS
==================================================

KHÔNG chỉ sửa Profile.

Apply cùng architecture cho:

Student:

- Đăng nhập / Đăng ký
- Khám phá sự kiện
- Chi tiết sự kiện
- Xác nhận đăng ký
- Vé của tôi
- Chi tiết vé
- QR
- Hồ sơ cá nhân
- Notification Center

Staff:

- QR Scanner
- Check-in Result
- Recent Check-in History

Mọi màn hình phải có vùng trên an toàn.

==================================================
36. HEADER CONTENT
==================================================

Không được để Dynamic Island che:

"Xin chào, {currentUser.displayName} 👋"

"Khám phá sự kiện"

"Hồ sơ cá nhân"

notification icon

avatar

Page title

Back button

Không element nào được nằm phía sau Dynamic Island.

==================================================
37. BOTTOM SAFE AREA
==================================================

Cũng phải có bottom safe area.

Nếu hỗ trợ:

bottomSafeArea =
max(env(safe-area-inset-bottom), 20px)

Bottom Navigation phải nằm phía trên home indicator.

Main content phải có đủ padding-bottom.

Card cuối cùng không được bị che bởi:

- Bottom navigation
- iPhone home indicator

==================================================
38. MOBILE SCROLLING
==================================================

TopSafeArea là một phần của layout.

Không để content nhảy lên vùng Dynamic Island khi scroll.

Nếu sticky header:

sticky top = 88px

Không:

top = 0.

Notification panel, modal và filter bottom sheet cũng phải đảm bảo content không bị Dynamic Island che.

==================================================
39. MOBILE RESPONSIVE
==================================================

Mobile:

390×844
414×896
430×932

Tablet:

768×1024
820×1180
1024×1366

Desktop:

1280×800
1440×900

Mobile:

→ 1-column event cards.

Tablet:

→ 2-column nếu đủ width.

Desktop:

→ 3-column nếu phù hợp.

Không chỉ scale toàn bộ desktop xuống mobile.

Phải reflow responsive.

==================================================
40. DESKTOP SAFE AREA
==================================================

Không áp dụng 88px safe area cho desktop.

Desktop:

1280×800
1440×900

giữ spacing bình thường.

Tablet sử dụng responsive spacing phù hợp.

Chỉ mobile phải có top safe area >= 88px.

==================================================
41. LOGIN
==================================================

Login phải hoạt động.

Có demo account.

Sau login:

→ xác định currentUser.

Tất cả các screen sau đó phải dùng currentUser.

Không hard-code tên user riêng từng screen.

==================================================
42. NAVIGATION
==================================================

Bottom navigation mobile:

Khám phá
Vé của tôi
Hồ sơ

phải hoạt động thật.

Khám phá:

→ Explore

Vé của tôi:

→ My Tickets

Hồ sơ:

→ Profile

Event Detail:

→ Register / View Ticket

Notification:

→ relevant Event / Ticket

Không có dead button.

==================================================
43. ERROR / EDGE CASES
==================================================

Phải xử lý:

- Event hết chỗ.
- Event đóng đăng ký.
- Event đã kết thúc.
- User đăng ký trùng.
- User hủy vé.
- User cố hủy vé đã check-in.
- User scan vé đã hủy.
- User scan vé đã check-in.
- QR không tồn tại.
- Ticket không thuộc event.
- Event bị Organizer hủy.
- Event được chỉnh sửa.
- Capacity nhỏ hơn registeredCount.
- Double click Register.
- Double click Cancel.
- Navigate nhiều screen.
- Refresh/reload nếu persistent state hỗ trợ.
- Event vừa đủ full sau khi user đăng ký.
- User hủy ticket cuối cùng.
- User đăng ký lại sau cancel.
- Ticket cũ đã cancel nhưng QR vẫn được scan.
- Notification đã read/unread.
- Profile update.

==================================================
44. REQUIRED TEST FLOW
==================================================

Sau khi sửa, PHẢI tự kiểm tra toàn bộ flow sau.

TEST 1 — INITIAL

Event:

180/200

20 remaining

User:

chưa đăng ký.

Click:

"Đăng ký ngay"

Expected:

181/200

19 remaining

Ticket mới xuất hiện.

Button:

"Xem vé"

Notification:

"Đăng ký thành công"

QR:

đúng ticket vừa tạo.

--------------------------------------------------

TEST 2 — NAVIGATION

Explore
→ Event Detail
→ My Tickets

Expected:

ticket vẫn tồn tại.

registeredCount vẫn:

181

remainingSlots:

19

--------------------------------------------------

TEST 3 — DUPLICATE REGISTER

Quay lại Event Detail.

Expected:

"Xem vé"

Không:

"Đăng ký ngay"

Click nhiều lần:

→ không tạo duplicate ticket.

--------------------------------------------------

TEST 4 — VIEW QR

Click:

"Xem vé"

Expected:

QR chính xác của ticket.

Không tạo QR khác.

--------------------------------------------------

TEST 5 — CANCEL

My Tickets
→ Hủy vé

Expected:

confirmation modal.

Click:

"Hủy vé"

Expected:

Ticket:

"Đã hủy"

Event:

181 → 180

Remaining:

19 → 20

Button:

"Đăng ký ngay"

Notification:

"Đã hủy vé"

--------------------------------------------------

TEST 6 — DUPLICATE CANCEL

Click cancel lần nữa.

Expected:

Không thay đổi.

Không:

180 → 179

Không:

20 → 21

--------------------------------------------------

TEST 7 — RE-REGISTER

Click:

"Đăng ký ngay"

Expected:

Ticket mới:

TKT-2026-0002

Ticket cũ:

TKT-2026-0001
→ Đã hủy

Ticket mới:

TKT-2026-0002
→ Chưa check-in

Event:

180 → 181

Remaining:

20 → 19

Không có 2 active tickets.

--------------------------------------------------

TEST 8 — CHECK-IN

Staff scan:

TKT-2026-0002

Expected:

"Check-in thành công"

Ticket:

"Chưa check-in"
→ "Đã check-in"

registeredCount:

181

remaining:

19

Không thay đổi.

--------------------------------------------------

TEST 9 — DUPLICATE CHECK-IN

Scan lại cùng ticket.

Expected:

"Vé đã được check-in"

Không tạo duplicate check-in.

--------------------------------------------------

TEST 10 — CANCEL CHECKED-IN TICKET

User cố hủy ticket đã check-in.

Expected:

Không cho hủy.

Hiển thị:

"Vé đã được check-in và không thể hủy."

registeredCount không đổi.

--------------------------------------------------

TEST 11 — SCAN CANCELLED TICKET

Scan:

TKT-2026-0001

Expected:

"Vé đã bị hủy và không thể check-in."

--------------------------------------------------

TEST 12 — PARTICIPANT LIST

Organizer mở participant list.

Expected:

Ticket active xuất hiện.

Ticket cancelled:

KHÔNG xuất hiện trong active participants.

Ticket checked-in:

xuất hiện với trạng thái đã check-in.

==================================================
45. SAFE AREA VALIDATION — MANDATORY
==================================================

Sau khi sửa, kiểm tra trực quan các mobile screen:

1. Khám phá sự kiện
2. Chi tiết sự kiện
3. Vé của tôi
4. Hồ sơ cá nhân
5. Notification
6. QR Check-in

Ở MỖI SCREEN:

Dynamic Island / camera cutout phải có EMPTY SPACE bên dưới.

Không có:

text
button
icon
avatar
header
title
interactive element

nào nằm phía sau hoặc bị che bởi Dynamic Island.

ĐẶC BIỆT kiểm tra:

"Hồ sơ cá nhân"

"Xin chào, {currentUser.displayName} 👋"

"Khám phá sự kiện"

notification icon

avatar

back button

Tất cả phải hoàn toàn visible.

Nếu screenshot vẫn cho thấy Dynamic Island che bất kỳ text/UI nào:

→ CHƯA ĐƯỢC coi là hoàn thành.

==================================================
46. DO NOT CHEAT
==================================================

KHÔNG giải quyết lỗi safe area bằng:

- chỉ giảm font size
- chỉ di chuyển title
- chỉ di chuyển avatar
- thêm margin ngẫu nhiên cho Profile
- thêm rectangle đè lên Dynamic Island
- che Dynamic Island
- chỉnh screenshot
- thay đổi mockup
- thay đổi hình Dynamic Island
- tạo khoảng trống giả không thuộc layout
- sửa riêng một screen

Phải sửa underlying mobile layout architecture.

Một TopSafeArea chung phải được dùng bởi toàn bộ mobile layout.

==================================================
47. FINAL AUDIT
==================================================

Trước khi hoàn thành, hãy audit toàn bộ prototype hiện tại.

Không chỉ sửa những lỗi được liệt kê.

Hãy chủ động tìm các logic không đồng bộ giữa:

Login
↔ Current User

Explore
↔ Search
↔ Filter

Event
↔ Registration

Registration
↔ Ticket

Ticket
↔ My Tickets

Ticket
↔ QR

Ticket
↔ Check-in

Ticket
↔ Cancellation

Cancellation
↔ Event Capacity

Event
↔ Organizer Dashboard

Ticket
↔ Participant List

Event
↔ Notification

Profile
↔ Header

Event Update
↔ Ticket

Event Cancellation
↔ Ticket

Navigation
↔ Application State

Responsive Layout
↔ Safe Area

==================================================
48. PRIORITY
==================================================

Ưu tiên theo thứ tự:

1. DATA CONSISTENCY
2. BUSINESS LOGIC
3. STATE MANAGEMENT
4. REGISTER / CANCEL / CHECK-IN FLOW
5. TICKET CONSISTENCY
6. USER FLOW
7. NAVIGATION
8. UI STATE
9. MOBILE SAFE AREA
10. RESPONSIVE UI

==================================================
49. FINAL REQUIREMENT
==================================================

Không được chỉ làm UI trông như đang hoạt động.

Tất cả nút chính phải có logic thật.

Tất cả dữ liệu liên quan phải đồng bộ.

Đặc biệt phải đảm bảo 3 chuỗi sau luôn nhất quán:

REGISTER
↔ TICKET
↔ EVENT CAPACITY
↔ MY TICKETS
↔ QR
↔ NOTIFICATION

CANCEL
↔ TICKET STATUS
↔ EVENT CAPACITY
↔ MY TICKETS
↔ EVENT DETAIL
↔ NOTIFICATION

CHECK-IN
↔ TICKET STATUS
↔ PARTICIPANT LIST
↔ CHECK-IN HISTORY

Và mobile layout:

DYNAMIC ISLAND
↓
88px MINIMUM TOP SAFE AREA
↓
APP HEADER
↓
PAGE CONTENT

Không được có bất kỳ application content nào nằm trong vùng Dynamic Island.

Giữ nguyên visual design hiện tại nếu không cần thay đổi.

Chỉ thay đổi visual khi cần để đảm bảo:
- usability
- responsive
- safe area
- data state
- business logic
- consistency.

ĐẶC BIỆT:

Nếu hiện tại "Hồ sơ cá nhân" vẫn bị Dynamic Island che, hãy coi đó là FAILURE và tiếp tục sửa layout cho đến khi hoàn toàn không còn overlap.

KHÔNG kết thúc task chỉ vì đã thêm safe-area CSS.

Hãy đảm bảo bằng cách kiểm tra trực quan trên các viewport mobile rằng nội dung thực sự nằm bên dưới Dynamic Island.