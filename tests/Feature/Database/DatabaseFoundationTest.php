<?php

namespace Tests\Feature\Database;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DatabaseFoundationTest extends TestCase
{
    /**
     * Test toàn bộ 24 bảng 3NF được tạo thành công trong database.
     */
    public function test_all_24_tables_exist(): void
    {
        $expectedTables = [
            'don_vi_to_chuc',
            'tai_khoan',
            'dang_ky_tam_thoi',
            'otp_quen_mat_khau',
            'sessions',
            'chuyen_de',
            'phong_hoi_truong',
            'su_kien',
            'su_kien_dong_to_chuc',
            'dat_phong',
            'phien_kiosk',
            'dang_ky',
            'hang_doi_waitlist',
            'nhan_vien_check_in',
            'danh_gia_feedback',
            'chung_nhan',
            'nhat_ky_kiem_duyet',
            'nhat_ky_diem_danh',
            'thong_bao',
            'thong_ke_su_kien_ngay',
            'jobs',
            'failed_jobs',
            'cache',
            'cache_locks',
        ];

        foreach ($expectedTables as $table) {
            $this->assertTrue(Schema::hasTable($table), "Bảng {$table} không tồn tại trong CSDL.");
        }
    }

    /**
     * Test 3 Database Views nghiệp vụ và AI hoạt động chính xác.
     */
    public function test_database_views_can_be_queried(): void
    {
        $views = [
            'v_event_analytics',
            'v_feedback_an_danh',
            'v_danh_sach_drl',
            'v_admin_bi_summary',
        ];

        foreach ($views as $view) {
            $result = DB::select("SELECT COUNT(*) as cnt FROM {$view}");
            $this->assertNotEmpty($result, "View {$view} không thể truy vấn.");
            $this->assertIsInt($result[0]->cnt);
        }
    }

    /**
     * Test Check Constraint: MSSV phải có định dạng 8 chữ số.
     */
    public function test_check_constraint_mssv_format(): void
    {
        $this->expectException(QueryException::class);

        DB::table('tai_khoan')->insert([
            'email' => 'bad_mssv@gm.uit.edu.vn',
            'mssv' => '123', // Không đủ 8 số
            'ho_ten' => 'Invalid Student',
            'mat_khau' => Hash::make('Password@123', ['cost' => 12]),
            'loai_tai_khoan' => 'SinhVien',
            'dong_y_nghi_dinh_13' => 1,
        ]);
    }

    /**
     * Test Check Constraint: Sinh viên bắt buộc phải có MSSV và đồng ý Nghị định 13.
     */
    public function test_check_constraint_student_requires_mssv_and_nd13(): void
    {
        $this->expectException(QueryException::class);

        DB::table('tai_khoan')->insert([
            'email' => 'sv_no_mssv@gm.uit.edu.vn',
            'mssv' => null, // Sinh viên không có MSSV
            'ho_ten' => 'No MSSV Student',
            'mat_khau' => Hash::make('Password@123', ['cost' => 12]),
            'loai_tai_khoan' => 'SinhVien',
            'dong_y_nghi_dinh_13' => 1,
        ]);
    }

    /**
     * Test Check Constraint: Sức chứa hội trường phải >= 10.
     */
    public function test_check_constraint_phong_capacity(): void
    {
        $this->expectException(QueryException::class);

        DB::table('phong_hoi_truong')->insert([
            'ten_phong' => 'Phòng Siêu Nhỏ',
            'co_so' => 'CoSo1',
            'suc_chua_toi_da' => 5, // < 10
            'trang_thai' => 'KhaDung',
        ]);
    }

    /**
     * Test Dữ liệu hạt giống (Seeders): Admin gốc, Cán bộ CTSV, Khoa HTTT, Sinh viên mẫu.
     */
    public function test_seed_data_integrity(): void
    {
        $admin = DB::table('tai_khoan')->where('email', 'admin@uit.edu.vn')->first();
        $this->assertNotNull($admin);
        $this->assertEquals('Admin', $admin->loai_tai_khoan);
        $this->assertTrue(Hash::check('Admin@123', $admin->mat_khau));

        $httt = DB::table('tai_khoan')->where('email', 'httt@uit.edu.vn')->first();
        $this->assertNotNull($httt);
        $this->assertEquals('ToChuc', $httt->loai_tai_khoan);
        $this->assertEquals(1, $httt->ma_don_vi_to_chuc);

        $student = DB::table('tai_khoan')->where('email', '22520001@gm.uit.edu.vn')->first();
        $this->assertNotNull($student);
        $this->assertEquals('SinhVien', $student->loai_tai_khoan);
        $this->assertEquals('22520001', $student->mssv);

        // Kiểm tra danh mục 6 khoa UIT
        $countKhoa = DB::table('don_vi_to_chuc')->where('loai_don_vi', 'Khoa')->count();
        $this->assertEquals(6, $countKhoa);

        // Kiểm tra phòng hội trường E
        $hoiTruongE = DB::table('phong_hoi_truong')->where('ten_phong', 'Hội trường E')->first();
        $this->assertNotNull($hoiTruongE);
        $this->assertEquals(500, $hoiTruongE->suc_chua_toi_da);
    }
}
