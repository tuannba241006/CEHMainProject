URGENT — GLOBAL RESPONSIVE + SAFE-AREA + UX FLOW REVISION DO NOT MAKE A LOCAL PATCH. DO NOT ONLY MOVE THE HEADER DOWN.

I am providing a screenshot showing a serious responsive issue: the iPhone Dynamic Island / front camera cutout physically overlaps the web content/header.

The current implementation is NOT acceptable because the content must never be hidden behind:

Dynamic Island
iPhone notch
Android punch-hole camera
Android camera cutout
rounded screen corners
browser safe areas
bottom gesture/navigation areas
==================================================

GLOBAL SAFE-AREA FIX — ALL DEVICES, ALL SCREENS
Fix this at the GLOBAL APP/SHELL level, NOT screen-by-screen.

IMPORTANT: Do NOT hard-code:

top: 30px
margin-top: 30px
padding-top: 40px
special CSS only for iPhone 14/15/16/etc.
device-specific hacks
manually drawn notch placeholders
The layout must dynamically respect the actual safe area reported by the browser/device.

Use the standard responsive web approach based on:

viewport-fit=cover
env(safe-area-inset-top)
env(safe-area-inset-right)
env(safe-area-inset-bottom)
env(safe-area-inset-left)
Use fallback values where appropriate.

Reference implementation principles: WebKit Safe Area: https://webkit.org/blog/7929/designing-websites-for-iphone-x/

MDN CSS environment variables: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env

MDN viewport: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport

DO NOT copy a fixed pixel value from the screenshot.

The system must automatically adapt to the device's safe area.

================================================== 2. APPLY SAFE AREA TO THE ENTIRE WEB APPLICATION ==================================================

This is NOT only for the login page.

Apply the same global responsive/safe-area system to EVERY screen and EVERY route in the application.

Audit ALL existing screens.

This includes at minimum:

AUTHENTICATION

Login
Register
Forgot password / reset password if present
STUDENT

Student home/dashboard
Events
Event detail
My registered events
QR/check-in related screens
Profile
Notifications
Any other student screen
CHECK-IN STAFF / AUTHORIZED STUDENT

Check-in dashboard
QR scanner
Camera permission state
Scan result
Successful check-in
Failed/invalid QR
Event selection if applicable
ORGANIZER / MANAGER

Organizer dashboard
Overview
Reports
Events
Event detail
Participant management
Attendance/check-in management
Any filters
Any tables/cards
Profile/settings
EVERY SCREEN MUST USE THE SAME SAFE-AREA SYSTEM.

Do not fix one screen and leave the others broken.

================================================== 3. RESPONSIVE DEVICE REQUIREMENT ==================================================

Design the interface so that it works across:

small iPhones
iPhones with Dynamic Island
iPhones with notch
iPhones without notch
Android phones with punch-hole cameras
Android phones with camera cutouts
Android phones with different aspect ratios
phones with rounded corners
phones with gesture navigation
phones with 3-button navigation
landscape orientation
portrait orientation
mobile browsers
PWA / standalone mode where applicable
DO NOT create separate designs for every phone model.

Instead create ONE robust responsive layout system.

The content area should be constrained by the available safe viewport.

No important UI element may overlap the camera cutout/notch.

No fixed header may overlap the top safe area.

No bottom navigation/button may overlap the home indicator or Android navigation area.

================================================== 4. GLOBAL APP SHELL ==================================================

Create a global structure conceptually equivalent to:

APP ├── Safe Area / App Shell │ ├── Header │ ├── Main Content │ └── Bottom Navigation / Bottom Actions │ └── Page Content

The header must automatically account for the top safe area.

The bottom navigation/action area must automatically account for the bottom safe area.

Do NOT add empty visual space unnecessarily on devices without a notch.

The safe-area spacing should only become larger when the device/browser reports a larger safe area.

Keep the visual design compact and professional.

================================================== 5. DO NOT MAKE THE WEB LOOK LIKE A MOBILE APP ==================================================

This is a WEB APPLICATION.

Keep the existing web visual language.

Do NOT turn every screen into a giant mobile-app card layout.

On mobile:

maintain proper web responsive behavior
preserve information hierarchy
use responsive stacking
use horizontal scrolling only where necessary
avoid excessive whitespace
avoid oversized cards
avoid unnecessarily huge buttons
maintain professional density
On desktop/tablet:

preserve the existing desktop layout
use responsive containers
do not artificially constrain everything to a phone-sized layout
================================================== 6. STUDENT ROLE + CHECK-IN PERMISSION ==================================================

IMPORTANT BUSINESS RULE:

A "check-in staff member" is NOT a separate type of employee.

A check-in staff member is still a STUDENT.

The system grants a specific student permission to perform check-in for a particular event.

Therefore:

ROLE: Student

PERMISSION: Can check in attendees for assigned event(s)

Do NOT redesign this as: "Employee account" or "Staff account"

Instead use permission-based behavior.

For a normal student:

Show normal student navigation.
For a student who has been granted check-in permission:

Keep the normal student experience.
Add an additional button/navigation item: "Điểm danh" or "Quét điểm danh"
This button should only appear when the logged-in student has check-in permission.

The student can then navigate directly to the check-in area.

Example:

Sinh viên bình thường → Trang chủ → Sự kiện → Đã tham gia → Hồ sơ

Sinh viên được cấp quyền điểm danh → Trang chủ → Sự kiện → Điểm danh → Đã tham gia → Hồ sơ

Do NOT create a completely separate student interface.

================================================== 7. CHECK-IN INTERFACE — CAMERA SCANNER ==================================================

The check-in student must be able to OPEN THE CAMERA DIRECTLY.

When the student enters "Điểm danh":

Show:

[ Quét mã QR ]

Then open the device camera.

Use the rear/environment camera by default because this is QR scanning.

The browser camera flow should conceptually use: getUserMedia() with: facingMode: "environment"

Reference: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia

IMPORTANT UX:

First visit: → Request camera permission

If permission granted: → Immediately show camera scanner

If permission denied: → Show a clear permission explanation → Button: "Cho phép camera"

Scanner screen should contain:

camera preview
QR scanning frame
event name
current event context
scan status
cancel/back button
After successful scan: → Show success state → Student/participant information → Event information → Check-in time → Confirmation

For invalid QR: → Show clear error state

For already checked-in: → Show: "Người tham gia đã được điểm danh"

Do not make the user manually upload a QR image unless there is an explicit fallback.

================================================== 8. ORGANIZER / MANAGER — PARTICIPANT FLOW ==================================================

CHANGE THE CURRENT PARTICIPANT MANAGEMENT UX.

Do NOT immediately show a giant participant list when clicking "Người tham gia".

The correct hierarchy is:

QUẢN LÝ → Người tham gia → Danh sách SỰ KIỆN → Chọn một SỰ KIỆN → Danh sách NGƯỜI THAM GIA của sự kiện đó

Specifically:

Screen 1: "Người tham gia"

Show a list of events.

Each event should show:

Event name
Event date
Location
Number of participants
Registration status if useful
Action: "Xem"
User clicks:

[Xem]

Then open:

"Người tham gia — [Tên sự kiện]"

Now show participant list.

Participant list can contain:

STT
Họ tên
MSSV
Email
Trạng thái đăng ký
Trạng thái điểm danh
Thời gian điểm danh
Actions On mobile, convert table rows into compact cards while preserving the same information hierarchy.
================================================== 9. ORGANIZER OVERVIEW + REPORT FILTERS ==================================================

The current date/year/month filtering logic is not reasonable.

REDESIGN THE FILTER SYSTEM.

Filters must have logical dependency.

Use:

Khoảng thời gian [ Từ ngày ] → [ Đến ngày ]

OR a preset:

[ Hôm nay ] [ 7 ngày qua ] [ 30 ngày qua ] [ Tháng này ] [ Quý này ] [ Năm nay ] [ Tùy chỉnh ]

If the user selects "Tùy chỉnh": → Show From Date + To Date.

Do NOT show: Ngày / Tháng / Năm as unrelated independent dropdowns that can create impossible combinations.

For reports/overview, the primary filter should be a DATE RANGE.

Optional secondary filters:

Sự kiện
Khoa/đơn vị
Trạng thái
Hình thức sự kiện
If a Year → Quarter → Month hierarchy is necessary, make the dependency logical:

Năm ↓ Quý ↓ Tháng

Changing Năm must update available Quý/Tháng.

Changing Quý must update available Tháng.

Do NOT allow impossible combinations.

================================================== 10. OVERVIEW DASHBOARD ==================================================

For organizer overview:

Top:

Page title
Date range filter
Event filter if needed
Summary cards:

Tổng số sự kiện
Tổng người đăng ký
Tổng người đã tham gia
Tỷ lệ tham gia
Then:

Registration trend
Attendance trend
Event statistics
Attendance rate
Charts must respond to the selected date range.

Example:

01/09/2026 → 30/09/2026

All dashboard numbers/charts represent ONLY this period.

If: 01/01/2026 → 31/12/2026

Then all metrics represent that period.

================================================== 11. REPORT SCREEN ==================================================

Reports should have the same filtering logic.

Top section:

Báo cáo

[ Khoảng thời gian ] [ Sự kiện ] [ Trạng thái ]

Then:

Export report
View report
Summary
Charts
Detailed data
Do not duplicate different filter systems on Overview and Reports.

Use a consistent filter component.

================================================== 12. NAVIGATION + BACK BEHAVIOR ==================================================

Make navigation hierarchy obvious.

Example:

Quản lý → Người tham gia → Sự kiện → Chi tiết người tham gia

Show appropriate:

back button
breadcrumb where appropriate
page title
When the user enters:

Người tham gia → Event A → Participant list

Back should return to: Người tham gia → Event list

NOT directly back to dashboard.

================================================== 13. MOBILE RESPONSIVE PARTICIPANT LIST ==================================================

On mobile, DO NOT force a huge desktop table.

Use participant cards:

[Avatar/initial] Nguyễn Văn A MSSV: 2252xxxx Email: ... Trạng thái: Đã điểm danh Thời gian: 08:42

[ Xem chi tiết ]

On tablet/desktop: Use a proper data table.

Responsive behavior must be automatic.

================================================== 14. SAFE AREA — IMPORTANT TECHNICAL REQUIREMENT ==================================================

Do NOT solve the screenshot by adding arbitrary margin/padding.

Implement the design so that the actual web implementation can use:

viewport-fit=cover

and:

env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)

with sensible fallbacks.

The important principle:

CONTENT must stay inside SAFE AREA

while the background can extend edge-to-edge.

For example, conceptually:

Header: padding-top: max(base spacing, safe-area-inset-top)

Bottom navigation: padding-bottom: max(base spacing, safe-area-inset-bottom)

Do NOT literally render the CSS code as visible UI.

The Figma design must visually demonstrate this behavior.

================================================== 15. RESPONSIVE TESTING CHECKLIST ==================================================

After redesigning, inspect EVERY SCREEN at:

320px width 360px width 375px width 390px width 393px width 412px width 430px width 768px width 1024px width 1280px+ 1440px+

Also inspect:

Portrait Landscape

Specifically check:

top header
logo
page title
tabs
buttons
inputs
cards
tables
bottom navigation
floating buttons
modal/dialog
QR scanner
camera UI
participant list
dashboard filters
NO text or button may be hidden behind:

notch
Dynamic Island
camera hole
rounded corner
bottom gesture area.
================================================== 16. IMPORTANT — DO NOT BREAK EXISTING DESIGN ==================================================

Preserve:

existing brand identity
CEH logo
typography hierarchy
current color system
current visual style
existing navigation structure where reasonable
Only redesign the parts required for:

global responsive/safe-area correctness
student check-in permission
camera QR scanner
participant management hierarchy
overview/report filters
responsive mobile layouts
Do NOT randomly redesign unrelated screens.

================================================== 17. FINAL QUALITY CHECK ==================================================

Before finishing:

Inspect ALL screens.
Inspect ALL navigation flows.
Inspect ALL mobile screens.
Inspect desktop/tablet screens.
Check top safe area globally.
Check bottom safe area globally.
Check Dynamic Island/notch scenarios.
Check Android punch-hole scenarios.
Check landscape.
Check student with/without check-in permission.
Check camera permission flow.
Check QR scanning flow.
Check organizer → participant → event → participant list flow.
Check Overview date filtering.
Check Reports date filtering.
Check all empty/error/loading states.
DO NOT SAY "fixed" unless the design has actually been updated across ALL relevant screens.

The screenshot I provided is evidence of a GLOBAL layout problem. Treat it as a system-level responsive design issue, not a single-page spacing issue. ================================================== 18. ORGANIZER — ASSIGN CHECK-IN PERMISSION BY EVENT ==================================================

IMPORTANT BUSINESS RULE:

A student can become a check-in staff member ONLY after an organizer grants that student check-in permission for a SPECIFIC EVENT.

The permission is EVENT-SCOPED.

Do NOT create a global permission:

"Student = can check in every event"

Instead:

Student A → has check-in permission → for Event A

but:

Student A → does NOT automatically have check-in permission → for Event B.

The organizer must explicitly assign the student to the event.

================================================== 19. ORGANIZER EVENT DETAIL — CHECK-IN STAFF ==================================================

Inside:

Ban tổ chức → Sự kiện → Chọn sự kiện → Chi tiết sự kiện

Add a section/tab:

"Nhân viên điểm danh"

or:

"Phân quyền điểm danh"

The organizer can see:

Nhân viên điểm danh ──────────────────────────── Nguyễn Văn A MSSV: 2252xxxx Email: ... Trạng thái: Đang hoạt động

Nguyễn Văn B MSSV: 2252xxxx Email: ... Trạng thái: Đang hoạt động

[ + Cấp quyền điểm danh ]

================================================== 20. GRANT CHECK-IN PERMISSION FLOW ==================================================

When organizer clicks:

[ + Cấp quyền điểm danh ]

Open:

"Cấp quyền điểm danh"

Step 1: Select student

[ Tìm kiếm theo MSSV / họ tên / email ]

Student result:

Nguyễn Văn A MSSV: 2252xxxx Email: student@uit.edu.vn

[ Chọn ]

Step 2:

Display the event being assigned:

Sự kiện: "Ngày hội tuyển dụng UIT 2026"

Ngày: 20/09/2026

Step 3:

Permission:

☑ Được phép điểm danh người tham gia

Optional:

Thời gian bắt đầu quyền
Thời gian kết thúc quyền
Then:

[ Hủy ] [ Cấp quyền ]

IMPORTANT:

The organizer is assigning:

STUDENT + EVENT + CHECK-IN PERMISSION

not simply changing the student's global role.

================================================== 21. PERMISSION CONFIRMATION ==================================================

Before granting:

"Xác nhận cấp quyền?"

Sinh viên: Nguyễn Văn A

Sự kiện: Ngày hội tuyển dụng UIT 2026

Quyền: Điểm danh người tham gia

[ Hủy ] [ Xác nhận cấp quyền ]

After confirmation:

Show success:

"Đã cấp quyền điểm danh cho Nguyễn Văn A" The student can now see the "Điểm danh" function.

================================================== 22. STUDENT CHECK-IN ACCESS LOGIC ==================================================

Student login behavior:

IF student has NO active check-in permission:

Student navigation:

Trang chủ
Sự kiện
Đã tham gia
Hồ sơ
DO NOT show "Điểm danh".

IF student has ACTIVE check-in permission:

Show:

Trang chủ
Sự kiện
Điểm danh
Đã tham gia
Hồ sơ
The "Điểm danh" section should only contain events for which this student has been granted check-in permission.

Example:

Student A:

Permission: Event A → YES Event B → NO Event C → YES

Then:

Điểm danh

[ Ngày hội tuyển dụng UIT 2026 ] Được cấp quyền điểm danh

[ Workshop Data Engineering ] Được cấp quyền điểm danh

DO NOT show Event B.

================================================== 23. MULTIPLE EVENTS ==================================================

A student may be assigned to multiple events.

Example:

Student A ├── Event A → Check-in permission ├── Event B → Check-in permission └── Event C → No permission

The student can only perform check-in for Event A and Event B.

When opening "Điểm danh":

Show:

"Chọn sự kiện cần điểm danh"

[ Event A ] [ Event B ]

After selecting an event:

→ Open camera → Scan participant QR → Validate QR against selected event → Check participant registration → Check whether participant belongs to selected event → Check whether participant is already checked in → Record check-in

================================================== 24. ORGANIZER — REVOKE CHECK-IN PERMISSION ==================================================

The organizer must also be able to revoke permission.

Inside:

Sự kiện → Chi tiết → Nhân viên điểm danh

Each student has:

[ ... ]

Actions:

Xem quyền
Tạm ngưng quyền
Thu hồi quyền
When selecting:

"Thu hồi quyền"

Show confirmation:

"Thu hồi quyền điểm danh?"

Sinh viên: Nguyễn Văn A

Sự kiện: Ngày hội tuyển dụng UIT 2026

After confirmation:

Status: "Đã thu hồi"

The student can no longer access check-in for that event.

================================================== 25. PERMISSION STATUS ==================================================

Use clear statuses:

Đang hoạt động Tạm ngưng Đã thu hồi Hết hạn

Visualize them consistently.

Do NOT confuse:

"Đã tham gia sự kiện"

with:

"Được cấp quyền điểm danh"

These are completely different concepts.

A student can:

REGISTERED for Event A but NOT have CHECK-IN PERMISSION.

Another student can:

REGISTERED for Event A AND have CHECK-IN PERMISSION.

================================================== 26. IMPORTANT DATA RELATIONSHIP ==================================================

The UI/business logic should conceptually represent:

Student ↓ Check-in Permission ↓ Event

NOT:

Student ↓ Global Check-in Role

The permission relationship is:

Student ↔ Event

with:

permission = CHECK_IN

This means the same student may have different permissions depending on the event.

================================================== 27. ORGANIZER EVENT DETAIL NAVIGATION ==================================================

Event detail should have tabs/sections such as:

[Tổng quan] [Người tham gia] [Điểm danh] [Nhân viên điểm danh]

"Nhân viên điểm danh" is where the organizer manages which students are authorized to perform check-in.

"Người tham gia" is where the organizer views participants.

"Điểm danh" is where the organizer views attendance/check-in results.

Do NOT merge these three concepts.

================================================== 28. COMPLETE BUSINESS FLOW ==================================================

The final UX should support this complete flow:

BAN TỔ CHỨC

→ Tạo / quản lý sự kiện → Mở Chi tiết sự kiện → Nhân viên điểm danh → + Cấp quyền điểm danh → Tìm sinh viên → Chọn sinh viên → Xác nhận quyền → Student receives event-specific check-in permission

STUDENT

→ Login → System checks permissions → Student has permission for Event A → "Điểm danh" appears → Open Điểm danh → Select Event A → Open camera → Scan participant QR → Validate → Check-in successful

ORGANIZER

→ Event detail → Điểm danh → View check-in statistics → View who checked in → View check-in time → Export/report if applicable

================================================== 29. IMPORTANT UI RULE ==================================================

DO NOT add "Nhân viên điểm danh" as a separate account type.

The system should communicate:

"Đây là sinh viên được cấp quyền điểm danh cho sự kiện này."

NOT:

"Đây là nhân viên."

The student remains a student throughout the system.

Only the permission changes.

================================================== 30. EDGE CASES ==================================================

Design UI states for:

Student has no check-in permission → No "Điểm danh" button.

Student has permission for one event → Show only that event.

Student has permission for multiple events → Show all authorized events.

Permission expired → Do not allow check-in.

Permission revoked → Remove access immediately.

Organizer attempts to assign a student twice → Show: " Sinh viên này đã được cấp quyền điểm danh cho sự kiện."

Student tries to scan QR belonging to another event → Reject: "QR không thuộc sự kiện đang điểm danh."

Student scans an already checked-in participant → Show: "Người tham gia đã được điểm danh."

Student scans invalid QR → Show: "Mã QR không hợp lệ."

Camera permission denied → Show camera permission recovery state.

================================================== FINAL REQUIREMENT
Treat CHECK-IN PERMISSION as an event-level authorization system.

The key relationship is:

BAN TỔ CHỨC ↓ cấp quyền SINH VIÊN ↓ được phép điểm danh MỘT / NHIỀU SỰ KIỆN CỤ THỂ

Never implement it as a global "check-in staff" role.

