---
name: test-integrity-harness
version: 1.0.0
priority: P0
trigger: always_on
description: Two-layer Soft Harness (Permission & Verification) to prevent Test Circumvention, Specification Gaming, and Circular Validation by AI agents.
---

# Test Integrity Soft Harness (2-Layer Protocol)

> **MANDATORY POLICY:** Designed to prevent **Test Circumvention** (ngụy tạo nghiệm thu bằng cách bẻ cong bài kiểm tra) and **Specification Gaming** (AI tối ưu hóa việc thỏa mãn assertion thay vì giải quyết bản chất logic).

---

## 🛡️ LAYER 1: PERMISSION LAYER (Ranh Giới Quyền Hạn)

### 1.1 Immutability of Test Specifications (Đóng Băng Bài Test)
- Khi nhận yêu cầu: Sửa lỗi (Fix bug), Tối ưu hóa (Refactor), hoặc Đảm bảo tính đúng đắn (Pass tests):
  - **Mọi file test (`tests/**`, `*.test.*`, `*.spec.*`) đều là READ-ONLY.**
  - Agent **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP**:
    - Sửa assertion để test dễ qua hơn (e.g. nới lỏng expect status code, bỏ kiểm tra schema).
    - Giảm số lượng request, giảm tải hoặc giảm độ khó của kịch bản test.
    - Xóa bớt edge cases hoặc skip test (`test.skip`, `xit`).
- **Ngoại lệ duy nhất:** Khi User chỉ định rõ ràng *"Hãy viết mới hoặc cập nhật kịch bản kiểm thử (Test Authoring mode)"*. Khi đó, Test Suite phải được đóng băng (freeze) trước khi chuyển sang bước sửa code.

### 1.2 Anti-Trivialization Principle (Chống Đơn Giản Hóa Kịch Bản)
- **Concurrency & Race Condition:**
  - ❌ **CẤM:** Dùng 1 account/user ID gửi nhiều request liên tiếp rồi kết luận hệ thống xử lý đồng thời (đây là Idempotency/Duplicate check, không phải Concurrency).
  - ✅ **BẮT BUỘC:** Kịch bản Concurrency phải mô phỏng **$N$ người dùng (Users/Tokens/Sessions) hoàn toàn khác nhau** cùng tranh chấp tài nguyên tại cùng thời điểm (sử dụng `Promise.all` hoặc parallel workers).
- **Isolation of Testing Concerns:**
  - Không được mock các cơ chế bảo vệ cốt lõi (Transaction, Database Locks, Unique Constraints) trong Integration Tests chỉ để làm test pass.

---

## 🔍 LAYER 2: VERIFICATION LAYER (Nghiệm Thu & Đối Soát Độc Lập)

### 2.1 Differential Gatekeeper (Kiểm Tra Git Diff)
Trước khi Agent báo cáo *"Đã sửa xong và pass test"*, Agent **BẮT BUỘC** phải:
1. Chạy lệnh:
   ```bash
   git diff --stat
   ```
2. **Quy tắc nghiệm thu:**
   - Nếu xuất hiện bất kỳ diff nào trong thư mục `tests/` hoặc các file test: **REJECT NGAY LẬP TỨC**. Coi như nhiệm vụ THẤT BẠI vì vi phạm Test Circumvention.
   - Toàn bộ diff chỉ được phép nằm trong thư mục triển khai logic (e.g. `backend/src/**`, `frontend/src/**`).

### 2.2 Empirical Evidence Requirement (Bằng Chứng Thực Thi Khách Quan)
- Agent không được phép chỉ nói *"Test passed"* dựa trên suy đoán hoặc inspection.
- Phải cung cấp log terminal thực tế với các chỉ số đo lường rõ ràng:
  - Danh sách User IDs/Tokens riêng biệt tham gia bài test.
  - Số lượng request thành công ($= \text{quota}$ cho phép).
  - Số lượng request bị từ chối chính xác với HTTP Status Code phù hợp (ví dụ: `409 Conflict`, `429 Too Many Requests`, hoặc `400 Sold Out`).

---

## 📋 SUMMARY CHECKLIST TRƯỚC KHI BÀN GIAO TASK

| Bước | Kiểm tra | Tiêu chuẩn đạt |
|---|---|---|
| **1. Permission** | File test có bị chỉnh sửa không? | `git diff -- tests/` = 0 lines changed |
| **2. Implementation** | Code logic có thật sự sửa không? | Diff nằm hoàn toàn trong Service/Controller |
| **3. Execution** | Test chạy thật chưa? | Có log output thực tế từ terminal |
| **4. Scenario Valid** | Kịch bản có bị đơn giản hóa không? | Multi-user thực sự tranh chấp tài nguyên |
