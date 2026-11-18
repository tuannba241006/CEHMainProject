FIX THE CURRENT CAMPUS EVENT HUB MOBILE UI — DO NOT REBUILD THE ENTIRE DESIGN FROM SCRATCH.

Hãy sửa trực tiếp giao diện hiện tại của màn hình STU-01 — "Khám phá sự kiện" và giữ nguyên visual style, màu sắc, nội dung, event cards và cấu trúc hiện tại nếu chúng đang hoạt động tốt.

Mục tiêu là sửa chính xác các lỗi responsive, Safe Area và horizontal scrolling dưới đây.

============================================================
1. FIX LỖI CAMERA / DYNAMIC ISLAND CHE NỘI DUNG
============================================================

Hiện tại phần:

"Xin chào, Duy Anh 👋"
"Khám phá sự kiện"

đang nằm quá sát mép trên màn hình và bị Dynamic Island / camera của iPhone che lên.

ĐÂY LÀ LỖI PHẢI SỬA.

Không được đặt header ở vị trí absolute sát top viewport.

Hãy tạo một vùng SAFE AREA ở phía trên.

Mobile viewport phải được tổ chức theo thứ tự:

SAFE AREA
↓
HEADER
↓
SEARCH
↓
FILTER CHỦ ĐỀ
↓
FILTER TRẠNG THÁI
↓
DANH SÁCH SỰ KIỆN
↓
BOTTOM NAVIGATION
↓
BOTTOM SAFE AREA

Header phải nằm hoàn toàn bên dưới Dynamic Island / camera.

Không có text, icon, button hoặc avatar nào được phép nằm phía sau Dynamic Island.

Khoảng cách từ Dynamic Island đến:

"Xin chào, Duy Anh 👋"

phải đủ lớn để text không bị che.

Không sử dụng vị trí tuyệt đối khiến header chạy dưới camera.

Ưu tiên:

padding-top: env(safe-area-inset-top)

hoặc tạo safe-area spacer tương đương trong Figma prototype.

Header mobile nên có khoảng đệm phía trên khoảng 44–56px tùy viewport.

Ví dụ cấu trúc:

┌───────────────────────────────┐
│       SAFE AREA               │
│                               │
│  Xin chào, Duy Anh 👋    🔔 DA │
│  Khám phá sự kiện             │
│                               │
│  [ Tìm kiếm... ] [Bộ lọc]     │
│                               │
└───────────────────────────────┘

Dynamic Island tuyệt đối không được che:

- Xin chào, Duy Anh
- Khám phá sự kiện
- Chuông thông báo
- Avatar

============================================================
2. HEADER MOBILE
============================================================

Giữ thiết kế hiện tại nhưng căn chỉnh lại.

Header:

"Xin chào, Duy Anh 👋"

bên dưới:

"Khám phá sự kiện"

Bên phải:

🔔 thông báo

avatar:

DA

Header phải sử dụng Auto Layout.

Không dùng absolute positioning cho text.

Avatar phải nằm trong vùng safe area.

Notification button phải có touch target tối thiểu 44 × 44px.

Avatar cũng tối thiểu 44 × 44px.

============================================================
3. FIX HÀNG FILTER CHỦ ĐỀ — QUAN TRỌNG NHẤT
============================================================

Hàng:

[Tất cả]
[Học thuật]
[Kỹ năng]
[Văn nghệ]
[Thể thao]
[Cộng đồng]

HIỆN TẠI ĐANG BỊ CẮT.

Tôi muốn hàng này trở thành một HORIZONTAL SCROLL CONTAINER THỰC SỰ.

Bắt buộc:

- Không wrap
- Không xuống dòng
- Không co nhỏ chip
- Không cắt text
- Không giới hạn width từng chip
- Không ép tất cả chip nằm vừa viewport
- Có thể swipe từ trái sang phải
- Có thể swipe từ phải sang trái
- Hỗ trợ touch gesture trên mobile
- Hỗ trợ horizontal scrolling trên tablet
- Có thể kéo bằng chuột nếu prototype hỗ trợ
- Giữ nguyên chiều cao của chip

Cấu trúc:

FILTER CONTAINER
    └── HORIZONTAL AUTO LAYOUT
          ├── Tất cả
          ├── Học thuật
          ├── Kỹ năng
          ├── Văn nghệ
          ├── Thể thao
          └── Cộng đồng

Container:

Overflow:
Horizontal scrolling

Layout:
Horizontal

Wrap:
OFF

Spacing:
8px

Padding:
16px left/right

Chip:
Hug contents

Không cho chip tự shrink.

============================================================
4. FILTER PHẢI SWIPE ĐƯỢC
============================================================

Trên màn hình mobile 390px:

Người dùng nhìn thấy:

[Tất cả] [Học thuật] [Kỹ năng] [Văn nghệ] ...

và phần:

[Thể thao]
[Cộng đồng]

có thể nằm ngoài viewport.

Người dùng phải có thể:

SWIPE LEFT

để xem:

[Thể thao] [Cộng đồng]

và có thể:

SWIPE RIGHT

để quay lại:

[Tất cả] [Học thuật] ...

Đây phải là horizontal scrolling thực tế chứ KHÔNG chỉ là hình ảnh bị cắt.

Không tạo scrollbar quá nổi bật.

Có thể sử dụng subtle fade/gradient ở cạnh phải để gợi ý rằng còn nội dung.

Ví dụ:

[Tất cả] [Học thuật] [Kỹ năng] [Văn nghệ] → 

Mũi tên/fade chỉ mang tính gợi ý, không che nội dung.

============================================================
5. FILTER TRẠNG THÁI
============================================================

Hàng thứ hai:

[Còn chỗ]
[Sắp hết]
[Hết chỗ]

cũng có thể horizontal scroll nếu viewport không đủ rộng.

Không bắt buộc phải cùng scroll container với filter chủ đề.

Có thể tạo:

Filter chủ đề → horizontal scroll

Filter trạng thái → horizontal scroll

Hai hàng độc lập.

============================================================
6. KHÔNG ĐỂ FILTER BỊ CHE HOẶC CẮT
============================================================

Đảm bảo:

- "Cộng đồng" không bị cắt giữa chữ
- "Thể thao" không bị mất
- "Văn nghệ" không bị mất
- Chip không bị clipping sai
- Chip không bị giảm width
- Text trong chip không wrap

Ví dụ:

SAI:

[Cộng...]

ĐÚNG:

[Cộng đồng]

============================================================
7. FILTER SELECTED STATE
============================================================

"Tất cả" mặc định được chọn.

Selected:

[Tất cả]

Background:
Primary blue / purple

Text:
White

Các filter còn lại:

Background:
Light gray / very light blue

Text:
Dark gray

Khi click:

"Học thuật"

thì:

"Học thuật" → selected

"Tất cả" → default

Khi click:

"Kỹ năng"

thì:

"Kỹ năng" → selected

Prototype phải có interaction cho filter.

============================================================
8. NÚT "BỘ LỌC"
============================================================

Nút:

"Bộ lọc"

ở bên phải ô tìm kiếm.

Button phải hoạt động.

Khi click:

→ mở Bottom Sheet trên mobile.

Bottom Sheet:

"Bộ lọc sự kiện"

Các nhóm:

Chủ đề

○ Tất cả
○ Học thuật
○ Kỹ năng
○ Văn nghệ
○ Thể thao
○ Cộng đồng

Trạng thái

○ Còn chỗ
○ Sắp hết
○ Hết chỗ

Ngày tổ chức

Địa điểm

Buttons:

"Xóa bộ lọc"

"Áp dụng"

Bottom Sheet phải nằm trong safe area.

Không che navigation.

============================================================
9. SEARCH BAR
============================================================

Giữ:

"Tìm kiếm sự kiện, diễn giả..."

Search bar không được bị camera hoặc filter che.

Mobile:

Search bar và button "Bộ lọc" nằm cùng một hàng nếu đủ width.

Nếu không đủ width:

Search bar nằm trên.

Button "Bộ lọc" nằm dưới.

Không ép text quá nhỏ.

============================================================
10. EVENT CARD
============================================================

Giữ nguyên thiết kế event card hiện tại.

Card đầu tiên:

"Học thuật"

"Còn chỗ" hoặc "Sắp hết"

"Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu"

"Nguyễn Minh Anh"

"15/10/2026 · 08:30"

"Trường Đại học Công nghệ Thông tin"

"180 / 200 chỗ đã đăng ký"

"20 chỗ còn lại"

Button:

"Xem chi tiết"

Card phải responsive.

Không để card bị kéo dài hoặc méo.

Mobile:

1 card / row.

Tablet:

2 cards / row nếu đủ width.

Desktop:

3 cards / row nếu phù hợp.

============================================================
11. BOTTOM NAVIGATION
============================================================

Bottom navigation phải nằm trong SAFE AREA.

Items:

"Khám phá"

"Vé của tôi"

"Hồ sơ"

Không để bottom navigation che event card.

Phải có bottom padding / safe-area inset.

Event list phải có đủ khoảng trống phía dưới để card cuối cùng không bị navigation che.

Không dùng fixed bottom navigation mà không chừa padding cho content.

============================================================
12. MOBILE SAFE AREA
============================================================

Đặc biệt kiểm tra:

Top safe area:

Dynamic Island / camera

Bottom safe area:

Home indicator

Không để:

- Header
- Search
- Filter
- Event card
- Button
- Bottom navigation

nằm dưới các vùng hệ thống của điện thoại.

Nếu thiết kế trong iPhone frame:

Content phải nằm trong safe area.

Nếu Figma prototype không mô phỏng được env():

Hãy tạo khoảng đệm tương đương bằng Auto Layout và padding.

============================================================
13. RESPONSIVE BREAKPOINTS
============================================================

MOBILE:

390 × 844

414 × 896

430 × 932

TABLET:

768 × 1024

820 × 1180

1024 × 1366

LAPTOP:

1280 × 800

1440 × 900

Không scale nguyên màn hình.

Phải reflow layout.

------------------------------------------------------------
MOBILE
------------------------------------------------------------

1 column event cards.

Horizontal scrolling filters.

Bottom navigation.

Safe area.

Header compact.

------------------------------------------------------------
TABLET
------------------------------------------------------------

2 column event cards nếu đủ width.

Filters vẫn horizontal scrolling nếu không đủ.

Có thể sử dụng sidebar/drawer phù hợp.

------------------------------------------------------------
LAPTOP
------------------------------------------------------------

3 column event cards.

Filter có thể hiển thị đầy đủ nếu đủ width.

Không cần horizontal scroll nếu tất cả chip vừa.

============================================================
14. QUAN TRỌNG: KHÔNG ĐƯỢC PHÁ DESIGN HIỆN TẠI
============================================================

Không thay đổi toàn bộ visual style.

Giữ:

- Màu sắc
- Typography
- Event images
- Card design
- Icon style
- Border radius
- Button style

Chỉ sửa:

1. Safe Area
2. Header position
3. Dynamic Island overlap
4. Filter horizontal scrolling
5. Filter interaction
6. Bottom navigation safe area
7. Responsive behavior

============================================================
15. KIỂM TRA SAU KHI SỬA
============================================================

Hãy tự kiểm tra màn hình ở:

390 × 844

414 × 896

430 × 932

768 × 1024

1024 × 1366

1440 × 900

Bắt buộc đảm bảo:

✓ "Xin chào, Duy Anh 👋" không bị Dynamic Island che

✓ "Khám phá sự kiện" không bị camera che

✓ Notification không bị camera che

✓ Avatar không bị camera che

✓ Filter chủ đề swipe trái/phải được

✓ "Tất cả" hiển thị đầy đủ

✓ "Học thuật" hiển thị đầy đủ

✓ "Kỹ năng" hiển thị đầy đủ

✓ "Văn nghệ" hiển thị đầy đủ

✓ "Thể thao" hiển thị đầy đủ

✓ "Cộng đồng" hiển thị đầy đủ

✓ Không có chip nào bị cắt chữ

✓ Filter không wrap

✓ Filter không shrink

✓ Filter có horizontal scrolling thật

✓ Nút "Bộ lọc" mở Bottom Sheet

✓ Filter có selected state

✓ Event card không bị filter che

✓ Event card không bị bottom navigation che

✓ Bottom navigation nằm trong safe area

✓ Không có text bị cắt

✓ Không có text bị bẻ thành từng chữ

✓ Không có card bị ép quá nhỏ

✓ Không có horizontal overflow ngoài ý muốn

✓ Giao diện vẫn đẹp và cân đối trên iPhone, iPad và laptop

Đây là bản sửa UI hiện tại, không tạo lại một thiết kế hoàn toàn khác.