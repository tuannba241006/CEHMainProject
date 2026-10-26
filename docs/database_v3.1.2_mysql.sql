-- =================================================================================
-- CAMPUS EVENT HUB - ENTERPRISE DATABASE SCHEMA (MYSQL 8.0+ / MARIADB INNODB)
-- Đồ án Môn học: Phát triển Ứng dụng Web (IS207.R11) - UIT
-- Phiên bản: 3.1.2 (Review & Refine Edition - Đồng bộ 100% SRS v3.1.2 & Chuẩn 3NF)
-- =================================================================================
-- THỨ TỰ KHÓA DÒNG BẮT BUỘC TOÀN CỤC (DEADLOCK-FREE LOCK ORDERING INVARIANT):
-- tai_khoan -> phong_hoi_truong -> dat_phong -> su_kien -> dang_ky -> hang_doi_waitlist
-- =================================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------------
-- 1. BẢNG: don_vi_to_chuc
-- ---------------------------------------------------------------------------------
DROP TABLE IF EXISTS `don_vi_to_chuc`;
CREATE TABLE `don_vi_to_chuc` (
    `ma_don_vi_to_chuc` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_don_vi_cha` BIGINT UNSIGNED NULL COMMENT 'Self-referencing FK: NULL = Cấp Trường; NOT NULL = CLB trực thuộc Khoa đó',
    `ten_don_vi` VARCHAR(200) NOT NULL,
    `ma_dinh_danh` VARCHAR(50) NOT NULL COMMENT 'Mã viết tắt, ví dụ KHOA_HTTT, CLB_WEBDEV, DOAN_TRUONG, PCTSV',
    `loai_don_vi` ENUM('CLB', 'DoanHoi', 'Khoa', 'PhongBan') NOT NULL,
    `mo_ta` TEXT NULL,
    `logo_url` VARCHAR(500) NULL,
    `hoat_dong` TINYINT(1) NOT NULL DEFAULT 1,
    `thoi_gian_tao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `thoi_gian_cap_nhat` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`ma_don_vi_to_chuc`),
    CONSTRAINT `uq_donvi_ten` UNIQUE (`ten_don_vi`),
    CONSTRAINT `uq_donvi_dinhdanh` UNIQUE (`ma_dinh_danh`),
    INDEX `idx_donvi_cha` (`ma_don_vi_cha`),
    CONSTRAINT `fk_donvi_cha` FOREIGN KEY (`ma_don_vi_cha`) REFERENCES `don_vi_to_chuc` (`ma_don_vi_to_chuc`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------------
-- 2. BẢNG: tai_khoan
-- [NÂNG CẤP v3.1.1]: Bổ sung ma_khoa (3NF), dong_y_nghi_dinh_13, buoc_doi_mat_khau.
-- ---------------------------------------------------------------------------------
DROP TABLE IF EXISTS `tai_khoan`;
CREATE TABLE `tai_khoan` (
    `ma_tai_khoan` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `mssv` VARCHAR(8) NULL COMMENT 'MSSV 8 chữ số; NULL với tài khoản nội bộ (@uit.edu.vn)',
    `email` VARCHAR(100) NOT NULL,
    `ho_ten` VARCHAR(150) NOT NULL,
    `mat_khau` VARCHAR(255) NOT NULL COMMENT 'Bcrypt cost=12',
    `so_dien_thoai` VARCHAR(20) NULL,
    `ma_khoa` BIGINT UNSIGNED NULL COMMENT '[3NF] FK tới don_vi_to_chuc (loai_don_vi = Khoa)',
    `khoa` VARCHAR(100) NULL COMMENT 'Tên Khoa hiển thị nhanh',
    `lop_sinh_hoat` VARCHAR(50) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `loai_tai_khoan` ENUM('Admin', 'ToChuc', 'SinhVien') NOT NULL DEFAULT 'SinhVien',
    `ma_don_vi_to_chuc` BIGINT UNSIGNED NULL COMMENT 'Bắt buộc với ToChuc; tùy chọn với Admin (UC-ADM-01 Bước 3)',
    `dong_y_nghi_dinh_13` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Đồng thuận Nghị định 13/2023/NĐ-CP (UC-AUTH-01, NFR-SEC-04)',
    `thoi_gian_dong_y_nd13` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `buoc_doi_mat_khau` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1: Tài khoản nội bộ mới cấp phải đổi mật khẩu lần đầu (UC-AUTH-02, UC-ADM-01)',
    `hoat_dong` TINYINT(1) NOT NULL DEFAULT 1,
    `thoi_gian_tao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `thoi_gian_cap_nhat` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`ma_tai_khoan`),
    CONSTRAINT `uq_taikhoan_email` UNIQUE (`email`),
    CONSTRAINT `uq_taikhoan_mssv` UNIQUE (`mssv`),
    CONSTRAINT `chk_taikhoan_mssv` CHECK (mssv IS NULL OR mssv REGEXP '^[0-9]{8}$'),
    CONSTRAINT `chk_taikhoan_sv_mssv` CHECK (loai_tai_khoan <> 'SinhVien' OR (mssv IS NOT NULL AND dong_y_nghi_dinh_13 = 1)),
    CONSTRAINT `chk_taikhoan_tochuc` CHECK (
        (loai_tai_khoan = 'ToChuc' AND ma_don_vi_to_chuc IS NOT NULL)
        OR (loai_tai_khoan = 'SinhVien' AND ma_don_vi_to_chuc IS NULL)
        OR (loai_tai_khoan = 'Admin')
    ),
    INDEX `idx_taikhoan_loai_hoatdong` (`loai_tai_khoan`, `hoat_dong`),
    INDEX `idx_taikhoan_khoa` (`ma_khoa`),
    CONSTRAINT `fk_taikhoan_donvi` FOREIGN KEY (`ma_don_vi_to_chuc`) REFERENCES `don_vi_to_chuc` (`ma_don_vi_to_chuc`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_taikhoan_khoa` FOREIGN KEY (`ma_khoa`) REFERENCES `don_vi_to_chuc` (`ma_don_vi_to_chuc`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------------
-- 3. BẢNG: dang_ky_tam_thoi
-- ---------------------------------------------------------------------------------
DROP TABLE IF EXISTS `dang_ky_tam_thoi`;
CREATE TABLE `dang_ky_tam_thoi` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `mssv` VARCHAR(8) NOT NULL,
    `ho_ten` VARCHAR(150) NOT NULL,
    `lop_sinh_hoat` VARCHAR(50) NOT NULL,
    `ma_khoa` BIGINT UNSIGNED NULL,
    `khoa` VARCHAR(100) NOT NULL,
    `so_dien_thoai` VARCHAR(20) NULL,
    `mat_khau` VARCHAR(255) NOT NULL,
    `dong_y_nghi_dinh_13` TINYINT(1) NOT NULL DEFAULT 1,
    `ma_otp_hash` CHAR(64) NOT NULL,
    `het_han_otp` DATETIME NOT NULL,
    `so_lan_nhap_sai` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `so_lan_gui_otp` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `cua_so_gui_otp_tu` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `thoi_gian_tao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_tamthoi_email` UNIQUE (`email`),
    CONSTRAINT `chk_tamthoi_nd13` CHECK (dong_y_nghi_dinh_13 = 1),
    CONSTRAINT `chk_tamthoi_sai` CHECK (so_lan_nhap_sai <= 5),
    CONSTRAINT `chk_tamthoi_gui` CHECK (so_lan_gui_otp <= 3),
    INDEX `idx_tamthoi_mssv` (`mssv`),
    INDEX `idx_tamthoi_hethan` (`het_han_otp`),
    CONSTRAINT `fk_tamthoi_khoa` FOREIGN KEY (`ma_khoa`) REFERENCES `don_vi_to_chuc` (`ma_don_vi_to_chuc`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------------
-- 4. BẢNG: otp_quen_mat_khau
-- ---------------------------------------------------------------------------------
DROP TABLE IF EXISTS `otp_quen_mat_khau`;
CREATE TABLE `otp_quen_mat_khau` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_tai_khoan` BIGINT UNSIGNED NOT NULL,
    `ma_otp_hash` CHAR(64) NOT NULL,
    `het_han` DATETIME NOT NULL,
    `da_su_dung` TINYINT(1) NOT NULL DEFAULT 0,
    `so_lan_thu_sai` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `thoi_gian_tao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `chk_otpqmk_sai` CHECK (so_lan_thu_sai <= 5),
    INDEX `idx_otpqmk_tk` (`ma_tai_khoan`, `da_su_dung`, `het_han`),
    CONSTRAINT `fk_otpqmk_taikhoan` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------------
-- 5. BẢNG: sessions
-- ---------------------------------------------------------------------------------
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `payload` LONGTEXT NOT NULL,
    `last_activity` INT NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_sessions_user` (`user_id`),
    INDEX `idx_sessions_last` (`last_activity`),
    CONSTRAINT `fk_sessions_taikhoan` FOREIGN KEY (`user_id`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------------
-- 6. BẢNG: chuyen_de
-- ---------------------------------------------------------------------------------
DROP TABLE IF EXISTS `chuyen_de`;
CREATE TABLE `chuyen_de` (
    `ma_chuyen_de` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ten_chuyen_de` VARCHAR(100) NOT NULL,
    `mo_ta` VARCHAR(255) NULL,
    `da_xoa` TINYINT(1) NOT NULL DEFAULT 0,
    `thoi_gian_tao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `thoi_gian_cap_nhat` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`ma_chuyen_de`),
    CONSTRAINT `uq_chuyende_ten` UNIQUE (`ten_chuyen_de`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------------
-- 7. BẢNG: phong_hoi_truong
-- ---------------------------------------------------------------------------------
DROP TABLE IF EXISTS `phong_hoi_truong`;
CREATE TABLE `phong_hoi_truong` (
    `ma_phong` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ten_phong` VARCHAR(100) NOT NULL,
    `co_so` ENUM('CoSo1', 'CoSo2') NOT NULL DEFAULT 'CoSo1',
    `suc_chua_toi_da` INT UNSIGNED NOT NULL,
    `trang_thiet_bi` JSON NULL,
    `trang_thai` ENUM('KhaDung', 'BaoTri') NOT NULL DEFAULT 'KhaDung',
    `bao_tri_tu_ngay` DATETIME NULL,
    `bao_tri_den_ngay` DATETIME NULL,
    `da_xoa` TINYINT(1) NOT NULL DEFAULT 0,
    `thoi_gian_tao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `thoi_gian_cap_nhat` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`ma_phong`),
    CONSTRAINT `uq_phong_ten_coso` UNIQUE (`ten_phong`, `co_so`),
    CONSTRAINT `chk_phong_succhua` CHECK (suc_chua_toi_da >= 10),
    CONSTRAINT `chk_phong_baotri` CHECK ((trang_thai = 'BaoTri' AND bao_tri_tu_ngay IS NOT NULL AND bao_tri_den_ngay IS NOT NULL AND bao_tri_tu_ngay < bao_tri_den_ngay) OR (trang_thai = 'KhaDung' AND bao_tri_tu_ngay IS NULL AND bao_tri_den_ngay IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------------
-- 8. BẢNG: su_kien
-- [NÂNG CẤP v3.1.1]: Bổ sung so_slot_dong_bang và thoi_gian_mo_cong_check_in.
-- ---------------------------------------------------------------------------------
DROP TABLE IF EXISTS `su_kien`;
CREATE TABLE `su_kien` (
    `ma_su_kien` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_don_vi_to_chuc` BIGINT UNSIGNED NOT NULL,
    `ma_chuyen_de` BIGINT UNSIGNED NOT NULL,
    `ma_phong` BIGINT UNSIGNED NOT NULL,
    `ten_su_kien` VARCHAR(255) NOT NULL,
    `anh_bia` VARCHAR(500) NULL,
    `dien_gia` VARCHAR(200) NULL,
    `mo_ta` TEXT NOT NULL,
    `lo_trinh` JSON NULL,
    `doi_tuong_tham_gia` VARCHAR(255) NULL,
    `ngay_cong_bo` DATETIME NOT NULL,
    `thoi_gian_bat_dau` DATETIME NOT NULL,
    `thoi_gian_ket_thuc` DATETIME NOT NULL,
    `thoi_gian_ket_thuc_thuc_te` DATETIME NULL,
    `khong_gioi_han_slot` TINYINT(1) NOT NULL DEFAULT 0,
    `so_luong_toi_da` INT UNSIGNED NULL,
    `so_ve_con_lai` INT UNSIGNED NULL,
    `so_slot_dong_bang` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Đóng băng slot khi < 15p trước T-2h mà còn người WAITING (UC-BOOK-03)',
    `thoi_diem_het_ve` DATETIME NULL,
    `dieu_khoan_drl` ENUM('KhongCo', 'Dieu3', 'Dieu4') NOT NULL DEFAULT 'KhongCo',
    `diem_drl_du_kien` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `gio_tinh_nguyen` DECIMAL(4,1) NOT NULL DEFAULT 0.0,
    `trang_thai` ENUM(
        'DRAFT',
        'WAITING_COHOST_CONFIRM',
        'COHOST_REJECTED',
        'PENDING_FACULTY',
        'PENDING_ADMIN',
        'APPROVED',
        'REJECTED',
        'PUBLISHED',
        'HAPPENING',
        'COMPLETED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'DRAFT',
    `cong_check_in_mo` TINYINT(1) NOT NULL DEFAULT 0,
    `thoi_gian_mo_cong_check_in` DATETIME NULL COMMENT 'Mốc mở cổng Check-in lần đầu làm căn cứ quét No-show (UC-OPS-01, UC-SYS-01)',
    `cong_check_out_mo` TINYINT(1) NOT NULL DEFAULT 0,
    `da_chot_drl` TINYINT(1) NOT NULL DEFAULT 0,
    `thoi_gian_chot_drl` DATETIME NULL,
    `thoi_gian_tao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `thoi_gian_cap_nhat` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`ma_su_kien`),
    CONSTRAINT `chk_sukien_thoigian` CHECK (thoi_gian_bat_dau < thoi_gian_ket_thuc),
    CONSTRAINT `chk_sukien_soluong` CHECK (
        (khong_gioi_han_slot = 1 AND so_luong_toi_da IS NULL AND so_ve_con_lai IS NULL AND so_slot_dong_bang = 0)
        OR (khong_gioi_han_slot = 0 AND so_luong_toi_da > 0)
    ),
    CONSTRAINT `chk_sukien_conlai` CHECK (
        khong_gioi_han_slot = 1
        OR (so_ve_con_lai IS NOT NULL AND (so_ve_con_lai + so_slot_dong_bang) <= so_luong_toi_da)
    ),
    CONSTRAINT `chk_sukien_congbo` CHECK (ngay_cong_bo <= thoi_gian_bat_dau),
    CONSTRAINT `chk_sukien_drl` CHECK (diem_drl_du_kien <= 5 AND (dieu_khoan_drl <> 'KhongCo' OR diem_drl_du_kien = 0)),
    CONSTRAINT `chk_sukien_chot` CHECK (da_chot_drl = 0 OR thoi_gian_chot_drl IS NOT NULL),
    INDEX `idx_sukien_tt_batdau` (`trang_thai`, `thoi_gian_bat_dau`),
    INDEX `idx_sukien_tt_congbo` (`trang_thai`, `ngay_cong_bo`),
    INDEX `idx_sukien_tt_ketthuc` (`trang_thai`, `thoi_gian_ket_thuc`),
    INDEX `idx_sukien_donvi_tt` (`ma_don_vi_to_chuc`, `trang_thai`),
    FULLTEXT INDEX `ft_sukien_timkiem` (`ten_su_kien`, `mo_ta`, `dien_gia`),
    CONSTRAINT `fk_sukien_donvi` FOREIGN KEY (`ma_don_vi_to_chuc`) REFERENCES `don_vi_to_chuc` (`ma_don_vi_to_chuc`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_sukien_chuyende` FOREIGN KEY (`ma_chuyen_de`) REFERENCES `chuyen_de` (`ma_chuyen_de`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_sukien_phong` FOREIGN KEY (`ma_phong`) REFERENCES `phong_hoi_truong` (`ma_phong`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------------
-- 9. BẢNG: su_kien_dong_to_chuc
-- ---------------------------------------------------------------------------------
DROP TABLE IF EXISTS `su_kien_dong_to_chuc`;
CREATE TABLE `su_kien_dong_to_chuc` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_su_kien` BIGINT UNSIGNED NOT NULL,
    `ma_don_vi_to_chuc` BIGINT UNSIGNED NOT NULL,
    `trang_thai_xac_nhan` ENUM('CHO_XAC_NHAN', 'DONG_Y', 'TU_CHOI') NOT NULL DEFAULT 'CHO_XAC_NHAN',
    `thoi_gian_phan_hoi` DATETIME NULL,
    `ghi_chu_tu_choi` TEXT NULL,
    `thoi_gian_tao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_dongtochuc_sukien_donvi` UNIQUE (`ma_su_kien`, `ma_don_vi_to_chuc`),
    CONSTRAINT `chk_dongtochuc_phanhoi` CHECK ((trang_thai_xac_nhan = 'CHO_XAC_NHAN' AND thoi_gian_phan_hoi IS NULL) OR (trang_thai_xac_nhan IN ('DONG_Y', 'TU_CHOI') AND thoi_gian_phan_hoi IS NOT NULL)),
    CONSTRAINT `chk_dongtochuc_tuchoi` CHECK (trang_thai_xac_nhan <> 'TU_CHOI' OR (ghi_chu_tu_choi IS NOT NULL AND CHAR_LENGTH(ghi_chu_tu_choi) >= 5)),
    INDEX `idx_dongtochuc_donvi_tt` (`ma_don_vi_to_chuc`, `trang_thai_xac_nhan`),
    INDEX `idx_dongtochuc_sukien_tt` (`ma_su_kien`, `trang_thai_xac_nhan`),
    CONSTRAINT `fk_dongtochuc_sukien` FOREIGN KEY (`ma_su_kien`) REFERENCES `su_kien` (`ma_su_kien`) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT `fk_dongtochuc_donvi` FOREIGN KEY (`ma_don_vi_to_chuc`) REFERENCES `don_vi_to_chuc` (`ma_don_vi_to_chuc`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------------
-- 10. BẢNG: dat_phong
-- ---------------------------------------------------------------------------------
DROP TABLE IF EXISTS `dat_phong`;
CREATE TABLE `dat_phong` (
    `ma_dat_phong` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_phong` BIGINT UNSIGNED NOT NULL,
    `ma_su_kien` BIGINT UNSIGNED NOT NULL,
    `thoi_gian_bat_dau` DATETIME NOT NULL,
    `thoi_gian_ket_thuc` DATETIME NOT NULL,
    `trang_thai` ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `han_giu_cho_tam` DATETIME NULL,
    `ghi_chu` VARCHAR(255) NULL,
    `thoi_gian_tao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `thoi_gian_cap_nhat` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `co_pending` TINYINT GENERATED ALWAYS AS (IF(trang_thai = 'PENDING', 1, NULL)) VIRTUAL,
    `co_confirmed` TINYINT GENERATED ALWAYS AS (IF(trang_thai = 'CONFIRMED', 1, NULL)) VIRTUAL,
    PRIMARY KEY (`ma_dat_phong`),
    CONSTRAINT `uq_datphong_pending` UNIQUE (`ma_su_kien`, `co_pending`),
    CONSTRAINT `uq_datphong_confirmed` UNIQUE (`ma_su_kien`, `co_confirmed`),
    CONSTRAINT `chk_datphong_thoigian` CHECK (thoi_gian_bat_dau < thoi_gian_ket_thuc),
    INDEX `idx_datphong_xungdot` (`ma_phong`, `thoi_gian_bat_dau`, `thoi_gian_ket_thuc`, `trang_thai`),
    CONSTRAINT `fk_datphong_phong` FOREIGN KEY (`ma_phong`) REFERENCES `phong_hoi_truong` (`ma_phong`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_datphong_sukien` FOREIGN KEY (`ma_su_kien`) REFERENCES `su_kien` (`ma_su_kien`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------------
-- 11. BẢNG MỚI [v3.1.1]: phien_kiosk
-- Quản lý Kiosk Session Token độc lập và khóa bí mật TOTP 30s (UC-AUTH-02, UC-OPS-01).
-- ---------------------------------------------------------------------------------
DROP TABLE IF EXISTS `phien_kiosk`;
CREATE TABLE `phien_kiosk` (
    `ma_phien_kiosk` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_su_kien` BIGINT UNSIGNED NOT NULL,
    `nguoi_kich_hoat` BIGINT UNSIGNED NOT NULL,
    `kiosk_token_hash` CHAR(64) NOT NULL COMMENT 'SHA-256 hash của Kiosk Session Token',
    `totp_secret` VARCHAR(64) NOT NULL COMMENT 'Khóa bí mật sinh mã Dynamic TOTP QR 30s (RFC 6238)',
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `thoi_gian_bat_dau` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `thoi_gian_het_han` DATETIME NOT NULL COMMENT 'Mặc định = su_kien.thoi_gian_ket_thuc + 15 phút',
    `da_thu_hoi` TINYINT(1) NOT NULL DEFAULT 0,
    `thoi_gian_thu_hoi` DATETIME NULL,
    PRIMARY KEY (`ma_phien_kiosk`),
    CONSTRAINT `uq_kiosk_token_hash` UNIQUE (`kiosk_token_hash`),
    CONSTRAINT `chk_kiosk_thoigian` CHECK (thoi_gian_bat_dau < thoi_gian_het_han),
    CONSTRAINT `chk_kiosk_thuhoi` CHECK (da_thu_hoi = 0 OR thoi_gian_thu_hoi IS NOT NULL),
    INDEX `idx_kiosk_sukien_hieuluc` (`ma_su_kien`, `da_thu_hoi`, `thoi_gian_het_han`),
    CONSTRAINT `fk_kiosk_sukien` FOREIGN KEY (`ma_su_kien`) REFERENCES `su_kien` (`ma_su_kien`) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT `fk_kiosk_nguoi` FOREIGN KEY (`nguoi_kich_hoat`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------------
-- 12. BẢNG: dang_ky
-- [NÂNG CẤP v3.1.1]: Bổ sung han_an_han_feedback và ma_thiet_bi_nghi_van.
-- ---------------------------------------------------------------------------------
DROP TABLE IF EXISTS `dang_ky`;
CREATE TABLE `dang_ky` (
    `ma_dang_ky` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_tai_khoan` BIGINT UNSIGNED NOT NULL,
    `ma_su_kien` BIGINT UNSIGNED NOT NULL,
    `ma_ve_uuid` CHAR(36) NOT NULL,
    `chu_ky_hmac` CHAR(64) NOT NULL,
    `trang_thai` ENUM('DaDangKy', 'DaCheckIn', 'DaCheckOut', 'DaHuy') NOT NULL DEFAULT 'DaDangKy',
    `thoi_gian_dang_ky` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `thoi_gian_check_in` DATETIME NULL,
    `thoi_gian_check_out` DATETIME NULL,
    `thoi_gian_huy` DATETIME NULL,
    `ly_do_huy` VARCHAR(255) NULL,
    `da_check_in` TINYINT(1) NOT NULL DEFAULT 0,
    `da_check_out` TINYINT(1) NOT NULL DEFAULT 0,
    `ma_thiet_bi_check_in` VARCHAR(100) NULL,
    `ma_thiet_bi_check_out` VARCHAR(100) NULL,
    `ma_thiet_bi_nghi_van` VARCHAR(100) NULL COMMENT 'Thiết bị bị chặn khi quét chéo tại UC-OPS-03.EX.1',
    `nghi_van_gian_lan` TINYINT(1) NOT NULL DEFAULT 0,
    `tham_gia_tron_ven` TINYINT(1) NOT NULL DEFAULT 0,
    `tham_gia_mot_phan` TINYINT(1) NOT NULL DEFAULT 0,
    `ti_le_drl` DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    `da_feedback` TINYINT(1) NOT NULL DEFAULT 0,
    `han_an_han_feedback` DATETIME NULL COMMENT 'Mốc ân hạn Feedback 24h do Admin cứu xét (UC-FEED-01.AC.1)',
    `du_dieu_kien_drl` TINYINT(1) NOT NULL DEFAULT 0,
    `vi_pham_no_show` TINYINT(1) NOT NULL DEFAULT 0,
    `da_gui_nhac_nho` TINYINT(1) NOT NULL DEFAULT 0,
    `ghi_chu` VARCHAR(255) NULL,
    `ma_tk_hieu_luc` BIGINT UNSIGNED GENERATED ALWAYS AS (IF(trang_thai <> 'DaHuy', ma_tai_khoan, NULL)) VIRTUAL,
    PRIMARY KEY (`ma_dang_ky`),
    CONSTRAINT `uq_dangky_uuid` UNIQUE (`ma_ve_uuid`),
    CONSTRAINT `uq_dangky_ve_hieu_luc` UNIQUE (`ma_su_kien`, `ma_tk_hieu_luc`),
    CONSTRAINT `uq_dangky_id_sukien` UNIQUE (`ma_dang_ky`, `ma_su_kien`),
    CONSTRAINT `chk_dangky_diemdanh` CHECK (
        (trang_thai = 'DaDangKy' AND da_check_in = 0 AND da_check_out = 0)
        OR (trang_thai = 'DaCheckIn' AND da_check_in = 1 AND da_check_out = 0 AND thoi_gian_check_in IS NOT NULL)
        OR (trang_thai = 'DaCheckOut' AND da_check_in = 1 AND da_check_out = 1 AND thoi_gian_check_in IS NOT NULL AND thoi_gian_check_out IS NOT NULL AND thoi_gian_check_out >= thoi_gian_check_in)
        OR (trang_thai = 'DaHuy' AND thoi_gian_huy IS NOT NULL)
    ),
    CONSTRAINT `chk_dangky_tile` CHECK (ti_le_drl IN (0.00, 0.50, 1.00)),
    CONSTRAINT `chk_dangky_thamdu1` CHECK (NOT (tham_gia_tron_ven = 1 AND tham_gia_mot_phan = 1)),
    CONSTRAINT `chk_dangky_thamdu2` CHECK (tham_gia_tron_ven = 0 OR (ti_le_drl = 1.00 AND da_check_out = 1)),
    CONSTRAINT `chk_dangky_thamdu3` CHECK (tham_gia_mot_phan = 0 OR (ti_le_drl = 0.50 AND da_check_out = 1)),
    CONSTRAINT `chk_dangky_feedback` CHECK (da_feedback = 0 OR da_check_out = 1),
    CONSTRAINT `chk_dangky_drl` CHECK (du_dieu_kien_drl = 0 OR (da_feedback = 1 AND ti_le_drl > 0)),
    CONSTRAINT `chk_dangky_noshow` CHECK (vi_pham_no_show = 0 OR (trang_thai = 'DaDangKy' AND da_check_in = 0 AND nghi_van_gian_lan = 0)),
    INDEX `idx_dangky_tk_sukien` (`ma_tai_khoan`, `ma_su_kien`),
    INDEX `idx_dangky_sukien_tt` (`ma_su_kien`, `trang_thai`),
    INDEX `idx_dangky_thietbi_in` (`ma_su_kien`, `ma_thiet_bi_check_in`),
    INDEX `idx_dangky_thietbi_out` (`ma_su_kien`, `ma_thiet_bi_check_out`),
    CONSTRAINT `fk_dangky_taikhoan` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_dangky_sukien` FOREIGN KEY (`ma_su_kien`) REFERENCES `su_kien` (`ma_su_kien`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------------
-- 13. BẢNG: hang_doi_waitlist
-- [NÂNG CẤP v3.1.1]: Bổ sung trạng thái SKIPPED_CONFLICT.
-- ---------------------------------------------------------------------------------
DROP TABLE IF EXISTS `hang_doi_waitlist`;
CREATE TABLE `hang_doi_waitlist` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_su_kien` BIGINT UNSIGNED NOT NULL,
    `ma_tai_khoan` BIGINT UNSIGNED NOT NULL,
    `so_thu_tu` INT UNSIGNED NOT NULL,
    `trang_thai` ENUM(
        'WAITING',
        'OFFERED',
        'ACCEPTED',
        'DECLINED',
        'EXPIRED',
        'SKIPPED_CONFLICT',
        'CLOSED_WAITLIST',
        'CANCELLED'
    ) NOT NULL DEFAULT 'WAITING',
    `thoi_gian_dang_ky` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `han_chot_xac_nhan` DATETIME NULL,
    `thoi_gian_phan_hoi` DATETIME NULL,
    `ma_tk_dang_cho` BIGINT UNSIGNED GENERATED ALWAYS AS (IF(trang_thai IN ('WAITING', 'OFFERED'), ma_tai_khoan, NULL)) VIRTUAL,
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_waitlist_thutu` UNIQUE (`ma_su_kien`, `so_thu_tu`),
    CONSTRAINT `uq_waitlist_dang_cho` UNIQUE (`ma_su_kien`, `ma_tk_dang_cho`),
    CONSTRAINT `chk_waitlist_thutu` CHECK (so_thu_tu > 0),
    CONSTRAINT `chk_waitlist_offered` CHECK (trang_thai <> 'OFFERED' OR han_chot_xac_nhan IS NOT NULL),
    INDEX `idx_waitlist_fifo` (`ma_su_kien`, `trang_thai`, `so_thu_tu`),
    INDEX `idx_waitlist_hanchot` (`trang_thai`, `han_chot_xac_nhan`),
    INDEX `idx_waitlist_tk` (`ma_tai_khoan`, `trang_thai`),
    CONSTRAINT `fk_waitlist_sukien` FOREIGN KEY (`ma_su_kien`) REFERENCES `su_kien` (`ma_su_kien`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_waitlist_taikhoan` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------------
-- 14. BẢNG: nhan_vien_check_in
-- ---------------------------------------------------------------------------------
DROP TABLE IF EXISTS `nhan_vien_check_in`;
CREATE TABLE `nhan_vien_check_in` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_tai_khoan` BIGINT UNSIGNED NOT NULL,
    `ma_su_kien` BIGINT UNSIGNED NOT NULL,
    `nguoi_phan_cong` BIGINT UNSIGNED NULL,
    `thoi_gian_phan_cong` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_staff_tk_sukien` UNIQUE (`ma_tai_khoan`, `ma_su_kien`),
    INDEX `idx_staff_sukien` (`ma_su_kien`),
    CONSTRAINT `fk_staff_taikhoan` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_staff_sukien` FOREIGN KEY (`ma_su_kien`) REFERENCES `su_kien` (`ma_su_kien`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_staff_nguoiphancong` FOREIGN KEY (`nguoi_phan_cong`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------------
-- 15. BẢNG: danh_gia_feedback
-- ---------------------------------------------------------------------------------
DROP TABLE IF EXISTS `danh_gia_feedback`;
CREATE TABLE `danh_gia_feedback` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_dang_ky` BIGINT UNSIGNED NOT NULL,
    `ma_su_kien` BIGINT UNSIGNED NOT NULL,
    `diem_noi_dung` TINYINT UNSIGNED NOT NULL,
    `diem_dien_gia` TINYINT UNSIGNED NOT NULL,
    `diem_to_chuc` TINYINT UNSIGNED NOT NULL,
    `y_kien_dong_gop` TEXT NULL,
    `thoi_gian_gui` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_feedback_ve` UNIQUE (`ma_dang_ky`, `ma_su_kien`),
    CONSTRAINT `chk_feedback_noidung` CHECK (diem_noi_dung BETWEEN 1 AND 5),
    CONSTRAINT `chk_feedback_diengia` CHECK (diem_dien_gia BETWEEN 1 AND 5),
    CONSTRAINT `chk_feedback_tochuc` CHECK (diem_to_chuc BETWEEN 1 AND 5),
    INDEX `idx_feedback_sukien` (`ma_su_kien`),
    CONSTRAINT `fk_feedback_dangky` FOREIGN KEY (`ma_dang_ky`, `ma_su_kien`) REFERENCES `dang_ky` (`ma_dang_ky`, `ma_su_kien`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------------
-- 16. BẢNG: chung_nhan
-- [NÂNG CẤP v3.1.1]: Bổ sung da_thu_hoi, thoi_gian_thu_hoi, nguoi_thu_hoi (UC-CERT-01).
-- ---------------------------------------------------------------------------------
DROP TABLE IF EXISTS `chung_nhan`;
CREATE TABLE `chung_nhan` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_dang_ky` BIGINT UNSIGNED NOT NULL,
    `ma_hash` CHAR(64) NOT NULL,
    `ngay_cap` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `da_thu_hoi` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1: Chứng nhận đã bị thu hồi (UC-CERT-01.AC.2)',
    `thoi_gian_thu_hoi` DATETIME NULL,
    `nguoi_thu_hoi` BIGINT UNSIGNED NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_chungnhan_dangky` UNIQUE (`ma_dang_ky`),
    CONSTRAINT `uq_chungnhan_hash` UNIQUE (`ma_hash`),
    CONSTRAINT `chk_chungnhan_thuhoi` CHECK (
        (da_thu_hoi = 0 AND thoi_gian_thu_hoi IS NULL AND nguoi_thu_hoi IS NULL)
        OR (da_thu_hoi = 1 AND thoi_gian_thu_hoi IS NOT NULL)
    ),
    CONSTRAINT `fk_chungnhan_dangky` FOREIGN KEY (`ma_dang_ky`) REFERENCES `dang_ky` (`ma_dang_ky`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_chungnhan_nguoithuhoi` FOREIGN KEY (`nguoi_thu_hoi`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------------
-- 17. BẢNG: nhat_ky_kiem_duyet
-- [NÂNG CẤP v3.1.1]: Bổ sung 6 hành động kiểm toán mới trong SRS v3.1.1.
-- ---------------------------------------------------------------------------------
DROP TABLE IF EXISTS `nhat_ky_kiem_duyet`;
CREATE TABLE `nhat_ky_kiem_duyet` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_su_kien` BIGINT UNSIGNED NULL,
    `ma_dang_ky` BIGINT UNSIGNED NULL,
    `ma_tai_khoan_muc_tieu` BIGINT UNSIGNED NULL,
    `nguoi_thuc_hien` BIGINT UNSIGNED NULL COMMENT 'NULL = Tác vụ nền tự động của Hệ thống (UC-SYS-01 System Worker)',
    `hanh_dong` ENUM(
        'SUBMIT',
        'WITHDRAW_PROPOSAL',
        'COHOST_ACCEPT',
        'COHOST_REJECT',
        'EXPIRE_COHOST_HOLD',
        'APPROVE_FACULTY',
        'APPROVE_FACULTY_BY_ADMIN',
        'REJECT_FACULTY',
        'APPROVE_ADMIN',
        'REJECT_ADMIN',
        'AUTO_REJECT_EXPIRED',
        'REQUEST_EDIT',
        'CHANGE_ROOM',
        'OPEN_CHECKIN_GATE',
        'EARLY_CHECKOUT_CONFIRM',
        'AUTO_OPEN_CHECKOUT',
        'CANCEL_EVENT',
        'CANCEL_TICKET',
        'GRANT_FEEDBACK_GRACE',
        'REVOKE_CERTIFICATE',
        'LOCK_DRL',
        'UNLOCK_DRL',
        'GRANT_ORGANIZER',
        'LOCK_ACCOUNT',
        'UNLOCK_ACCOUNT'
    ) NOT NULL,
    `trang_thai_truoc` VARCHAR(50) NULL,
    `trang_thai_sau` VARCHAR(50) NULL,
    `ly_do` TEXT NULL,
    `thoi_gian_tao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `chk_kiemduyet_doituong` CHECK (ma_su_kien IS NOT NULL OR ma_dang_ky IS NOT NULL OR ma_tai_khoan_muc_tieu IS NOT NULL),
    CONSTRAINT `chk_kiemduyet_lydo` CHECK (
        (hanh_dong NOT IN (
            'WITHDRAW_PROPOSAL',
            'COHOST_REJECT',
            'APPROVE_FACULTY_BY_ADMIN',
            'REJECT_FACULTY',
            'REJECT_ADMIN',
            'REQUEST_EDIT',
            'CHANGE_ROOM',
            'EARLY_CHECKOUT_CONFIRM',
            'AUTO_OPEN_CHECKOUT',
            'CANCEL_EVENT',
            'CANCEL_TICKET',
            'GRANT_FEEDBACK_GRACE',
            'REVOKE_CERTIFICATE',
            'UNLOCK_DRL',
            'LOCK_ACCOUNT'
        ) OR (ly_do IS NOT NULL AND CHAR_LENGTH(TRIM(ly_do)) > 0))
        AND (hanh_dong NOT IN ('REJECT_FACULTY', 'REJECT_ADMIN') OR CHAR_LENGTH(ly_do) >= 10)
    ),
    INDEX `idx_kiemduyet_sukien` (`ma_su_kien`, `thoi_gian_tao`),
    INDEX `idx_kiemduyet_nguoi` (`nguoi_thuc_hien`, `thoi_gian_tao`),
    CONSTRAINT `fk_kiemduyet_sukien` FOREIGN KEY (`ma_su_kien`) REFERENCES `su_kien` (`ma_su_kien`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_kiemduyet_dangky` FOREIGN KEY (`ma_dang_ky`) REFERENCES `dang_ky` (`ma_dang_ky`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_kiemduyet_muctieu` FOREIGN KEY (`ma_tai_khoan_muc_tieu`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_kiemduyet_nguoi` FOREIGN KEY (`nguoi_thuc_hien`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------------
-- 18. BẢNG: nhat_ky_diem_danh
-- [NÂNG CẤP v3.1.1]: Bổ sung ti_le_drl_cu và ti_le_drl_moi.
-- ---------------------------------------------------------------------------------
DROP TABLE IF EXISTS `nhat_ky_diem_danh`;
CREATE TABLE `nhat_ky_diem_danh` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_dang_ky` BIGINT UNSIGNED NOT NULL,
    `nguoi_thuc_hien` BIGINT UNSIGNED NOT NULL COMMENT 'Bắt buộc tài khoản BTC hoặc Admin thực hiện điều chỉnh thủ công (UC-OPS-04)',
    `trang_thai_cu` ENUM('DaDangKy', 'DaCheckIn', 'DaCheckOut', 'DaHuy') NOT NULL,
    `trang_thai_moi` ENUM('DaCheckIn', 'DaCheckOut') NOT NULL,
    `ti_le_drl_cu` DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    `ti_le_drl_moi` DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    `ly_do` TEXT NOT NULL,
    `thoi_gian_tao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `chk_diemdanh_lydo` CHECK (CHAR_LENGTH(ly_do) >= 10),
    CONSTRAINT `chk_diemdanh_tile` CHECK (ti_le_drl_cu IN (0.00, 0.50, 1.00) AND ti_le_drl_moi IN (0.00, 0.50, 1.00)),
    CONSTRAINT `chk_diemdanh_khac` CHECK (trang_thai_cu <> trang_thai_moi OR ti_le_drl_cu <> ti_le_drl_moi),
    INDEX `idx_diemdanh_ve` (`ma_dang_ky`, `thoi_gian_tao`),
    INDEX `idx_diemdanh_nguoi` (`nguoi_thuc_hien`),
    CONSTRAINT `fk_diemdanh_dangky` FOREIGN KEY (`ma_dang_ky`) REFERENCES `dang_ky` (`ma_dang_ky`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_diemdanh_nguoi` FOREIGN KEY (`nguoi_thuc_hien`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------------
-- 19. BẢNG: thong_bao
-- ---------------------------------------------------------------------------------
DROP TABLE IF EXISTS `thong_bao`;
CREATE TABLE `thong_bao` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_tai_khoan` BIGINT UNSIGNED NOT NULL,
    `tieu_de` VARCHAR(200) NOT NULL,
    `noi_dung` TEXT NOT NULL,
    `loai_thong_bao` ENUM(
        'HE_THONG',
        'MOI_DONG_TO_CHUC',
        'PHAN_HOI_DONG_TO_CHUC',
        'DE_XUAT_SU_KIEN',
        'KET_QUA_KIEM_DUYET',
        'CAP_NHAT_SU_KIEN',
        'DOI_PHONG_KHAN_CAP',
        'HUY_SU_KIEN',
        'NHAC_HEN',
        'CLAIM_SLOT',
        'VE_MOI',
        'WAITLIST_DONG',
        'CANH_BAO_NO_SHOW'
    ) NOT NULL,
    `lien_ket` VARCHAR(255) NULL,
    `da_doc` TINYINT(1) NOT NULL DEFAULT 0,
    `thoi_gian_gui` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_thongbao_tk` (`ma_tai_khoan`, `da_doc`, `thoi_gian_gui`),
    CONSTRAINT `fk_thongbao_taikhoan` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------------
-- 20. BẢNG: thong_ke_su_kien_ngay
-- ---------------------------------------------------------------------------------
DROP TABLE IF EXISTS `thong_ke_su_kien_ngay`;
CREATE TABLE `thong_ke_su_kien_ngay` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ngay_thong_ke` DATE NOT NULL,
    `ma_su_kien` BIGINT UNSIGNED NOT NULL,
    `tong_ve_phat_hanh` INT UNSIGNED NULL,
    `tong_ve_dang_ky` INT UNSIGNED NOT NULL DEFAULT 0,
    `tong_luot_tham_du` INT UNSIGNED NOT NULL DEFAULT 0,
    `tong_luot_check_out` INT UNSIGNED NOT NULL DEFAULT 0,
    `tong_luot_no_show` INT UNSIGNED NOT NULL DEFAULT 0,
    `so_phut_chay_ve` INT NULL,
    `diem_hai_long_trung_binh` DECIMAL(3,2) NULL,
    `thoi_gian_cap_nhat` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_thongke_ngay_sukien` UNIQUE (`ngay_thong_ke`, `ma_su_kien`),
    INDEX `idx_thongke_sukien` (`ma_su_kien`),
    CONSTRAINT `fk_thongke_sukien` FOREIGN KEY (`ma_su_kien`) REFERENCES `su_kien` (`ma_su_kien`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------------
-- 21..24. BẢNG HẠ TẦNG KỸ THUẬT LARAVEL (jobs, failed_jobs, cache, cache_locks)
-- ---------------------------------------------------------------------------------
DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `queue` VARCHAR(255) NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `attempts` TINYINT UNSIGNED NOT NULL,
    `reserved_at` INT UNSIGNED NULL,
    `available_at` INT UNSIGNED NOT NULL,
    `created_at` INT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_jobs_queue` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `failed_jobs`;
CREATE TABLE `failed_jobs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `uuid` VARCHAR(255) NOT NULL,
    `connection` TEXT NOT NULL,
    `queue` TEXT NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `exception` LONGTEXT NOT NULL,
    `failed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_failedjobs_uuid` UNIQUE (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cache`;
CREATE TABLE `cache` (
    `key` VARCHAR(255) NOT NULL,
    `value` MEDIUMTEXT NOT NULL,
    `expiration` INT NOT NULL,
    PRIMARY KEY (`key`),
    INDEX `idx_cache_expiration` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cache_locks`;
CREATE TABLE `cache_locks` (
    `key` VARCHAR(255) NOT NULL,
    `owner` VARCHAR(255) NOT NULL,
    `expiration` INT NOT NULL,
    PRIMARY KEY (`key`),
    INDEX `idx_cachelocks_expiration` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- DATABASE VIEWS NGHIỆP VỤ & AI ANALYTICS (3 VIEWS)
-- =================================================================================

DROP VIEW IF EXISTS `v_event_analytics`;
CREATE VIEW `v_event_analytics` AS
SELECT
    sk.ma_su_kien,
    sk.ten_su_kien,
    dv.ten_don_vi AS don_vi_chu_tri,
    dv_cha.ten_don_vi AS don_vi_cap_tren,
    COALESCE(co.so_don_vi_dong_to_chuc, 0) AS so_don_vi_dong_to_chuc,
    cd.ten_chuyen_de,
    ph.ten_phong,
    ph.co_so,
    sk.trang_thai,
    sk.ngay_cong_bo,
    sk.thoi_gian_bat_dau,
    sk.thoi_gian_ket_thuc,
    sk.khong_gioi_han_slot,
    sk.so_luong_toi_da,
    sk.so_ve_con_lai,
    sk.so_slot_dong_bang,
    COALESCE(t.so_ve_da_dat, 0) AS so_ve_da_dat,
    COALESCE(t.so_luot_check_in, 0) AS so_luot_check_in,
    COALESCE(t.so_luot_check_out, 0) AS so_luot_check_out,
    COALESCE(t.so_luot_nhan_drl, 0) AS so_luot_nhan_drl,
    COALESCE(t.so_luot_no_show, 0) AS so_luot_no_show,
    CASE
        WHEN sk.khong_gioi_han_slot = 1 OR sk.so_luong_toi_da IS NULL OR sk.so_luong_toi_da = 0 THEN NULL
        ELSE ROUND(COALESCE(t.so_ve_da_dat, 0) * 100 / sk.so_luong_toi_da, 2)
    END AS ti_le_lap_day_pct,
    sk.thoi_diem_het_ve,
    TIMESTAMPDIFF(MINUTE, sk.ngay_cong_bo, sk.thoi_diem_het_ve) AS so_phut_chay_ve,
    sk.dieu_khoan_drl,
    sk.diem_drl_du_kien,
    f.diem_noi_dung_tb,
    f.diem_dien_gia_tb,
    f.diem_to_chuc_tb
FROM su_kien sk
JOIN don_vi_to_chuc dv ON dv.ma_don_vi_to_chuc = sk.ma_don_vi_to_chuc
LEFT JOIN don_vi_to_chuc dv_cha ON dv_cha.ma_don_vi_to_chuc = dv.ma_don_vi_cha
JOIN chuyen_de cd ON cd.ma_chuyen_de = sk.ma_chuyen_de
JOIN phong_hoi_truong ph ON ph.ma_phong = sk.ma_phong
LEFT JOIN (
    SELECT ma_su_kien,
           COUNT(CASE WHEN trang_thai_xac_nhan = 'DONG_Y' THEN 1 END) AS so_don_vi_dong_to_chuc
    FROM su_kien_dong_to_chuc
    GROUP BY ma_su_kien
) co ON co.ma_su_kien = sk.ma_su_kien
LEFT JOIN (
    SELECT ma_su_kien,
           COUNT(CASE WHEN trang_thai <> 'DaHuy' THEN 1 END) AS so_ve_da_dat,
           COUNT(CASE WHEN da_check_in = 1 THEN 1 END) AS so_luot_check_in,
           COUNT(CASE WHEN da_check_out = 1 THEN 1 END) AS so_luot_check_out,
           COUNT(CASE WHEN du_dieu_kien_drl = 1 THEN 1 END) AS so_luot_nhan_drl,
           COUNT(CASE WHEN vi_pham_no_show = 1 THEN 1 END) AS so_luot_no_show
    FROM dang_ky
    GROUP BY ma_su_kien
) t ON t.ma_su_kien = sk.ma_su_kien
LEFT JOIN (
    SELECT ma_su_kien,
           ROUND(AVG(diem_noi_dung), 2) AS diem_noi_dung_tb,
           ROUND(AVG(diem_dien_gia), 2) AS diem_dien_gia_tb,
           ROUND(AVG(diem_to_chuc), 2) AS diem_to_chuc_tb
    FROM danh_gia_feedback
    GROUP BY ma_su_kien
) f ON f.ma_su_kien = sk.ma_su_kien
WHERE sk.trang_thai IN ('APPROVED', 'PUBLISHED', 'HAPPENING', 'COMPLETED', 'CANCELLED');

DROP VIEW IF EXISTS `v_feedback_an_danh`;
CREATE VIEW `v_feedback_an_danh` AS
SELECT
    ma_su_kien,
    diem_noi_dung,
    diem_dien_gia,
    diem_to_chuc,
    y_kien_dong_gop,
    thoi_gian_gui
FROM danh_gia_feedback;

DROP VIEW IF EXISTS `v_danh_sach_drl`;
CREATE VIEW `v_danh_sach_drl` AS
SELECT
    dk.ma_su_kien,
    ROW_NUMBER() OVER (PARTITION BY dk.ma_su_kien ORDER BY tk.mssv) AS stt,
    tk.mssv,
    tk.ho_ten,
    tk.lop_sinh_hoat,
    COALESCE(dv_khoa.ten_don_vi, tk.khoa) AS khoa,
    sk.ten_su_kien,
    sk.dieu_khoan_drl AS dieu_drl,
    ROUND(sk.diem_drl_du_kien * dk.ti_le_drl, 2) AS diem_cong_thuc_nhan,
    dk.thoi_gian_check_in AS thoi_gian_vao,
    dk.thoi_gian_check_out AS thoi_gian_ra,
    GREATEST(
        0,
        TIMESTAMPDIFF(
            MINUTE,
            GREATEST(dk.thoi_gian_check_in, sk.thoi_gian_bat_dau),
            LEAST(dk.thoi_gian_check_out, COALESCE(sk.thoi_gian_ket_thuc_thuc_te, sk.thoi_gian_ket_thuc))
        )
    ) AS thoi_luong_tham_du_phut,
    CASE
        WHEN dk.tham_gia_tron_ven = 1 THEN 'Tham dự trọn vẹn (100%)'
        WHEN dk.tham_gia_mot_phan = 1 THEN 'Tham dự một phần (50%)'
        ELSE NULL
    END AS ghi_chu_tham_du
FROM dang_ky dk
JOIN tai_khoan tk ON tk.ma_tai_khoan = dk.ma_tai_khoan
LEFT JOIN don_vi_to_chuc dv_khoa ON dv_khoa.ma_don_vi_to_chuc = tk.ma_khoa
JOIN su_kien sk ON sk.ma_su_kien = dk.ma_su_kien
WHERE dk.du_dieu_kien_drl = 1;

SET FOREIGN_KEY_CHECKS = 1;