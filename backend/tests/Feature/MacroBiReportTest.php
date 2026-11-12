<?php

namespace Tests\Feature;

use App\Models\ChuyenDe;
use App\Models\DangKy;
use App\Models\DonViToChuc;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class MacroBiReportTest extends TestCase
{
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::query()
            ->where('loai_tai_khoan', 'Admin')
            ->firstOrFail();
    }

    public function test_admin_can_read_macro_dashboard_with_success_envelope(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/analytics/macro')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'tu_ngay',
                    'den_ngay',
                    'tong_so_su_kien',
                    'tong_luot_sinh_vien_tham_gia',
                    'ty_le_show_up_toan_truong_pct',
                    'ty_le_no_show_toan_truong_pct',
                    'toc_do_chay_ve_phut_tb',
                    'su_kien_theo_chuyen_de',
                    'su_kien_theo_cap_don_vi',
                    'cong_suat_su_dung_phong',
                    'top_don_vi_hoat_dong_tich_cuc',
                ],
                'message',
            ]);
    }

    public function test_macro_dashboard_requires_authentication(): void
    {
        $this->getJson('/api/v1/admin/analytics/macro')->assertUnauthorized();
    }

    public function test_macro_dashboard_forbids_students(): void
    {
        $student = User::query()->where('loai_tai_khoan', 'SinhVien')->firstOrFail();

        $this->actingAs($student)
            ->getJson('/api/v1/admin/analytics/macro')
            ->assertForbidden();
    }

    public function test_macro_dashboard_forbids_organizers(): void
    {
        $organizer = User::query()->where('loai_tai_khoan', 'ToChuc')->firstOrFail();

        $this->actingAs($organizer)
            ->getJson('/api/v1/admin/analytics/macro')
            ->assertForbidden();
    }

    public function test_macro_dashboard_defaults_to_ninety_days_through_yesterday(): void
    {
        $today = Carbon::today();

        $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/analytics/macro')
            ->assertOk()
            ->assertJsonPath('data.tu_ngay', $today->copy()->subDays(90)->toDateString())
            ->assertJsonPath('data.den_ngay', $today->copy()->subDay()->toDateString());
    }

    public function test_macro_dashboard_rejects_start_date_after_end_date(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/analytics/macro?tu_ngay=2026-11-10&den_ngay=2026-11-09')
            ->assertUnprocessable();
    }

    public function test_macro_dashboard_filters_daily_statistics_to_requested_date_range(): void
    {
        $event = $this->createReportEvent();
        $this->seedDailyStatistics($event, [
            ['ngay_thong_ke' => '2026-10-01', 'tong_luot_tham_du' => 2],
            ['ngay_thong_ke' => '2026-10-10', 'tong_luot_tham_du' => 5],
            ['ngay_thong_ke' => '2026-10-20', 'tong_luot_tham_du' => 11],
        ]);

        $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/analytics/macro?tu_ngay=2026-10-05&den_ngay=2026-10-15')
            ->assertOk()
            ->assertJsonPath('data.tu_ngay', '2026-10-05')
            ->assertJsonPath('data.den_ngay', '2026-10-15')
            ->assertJsonPath('data.tong_luot_sinh_vien_tham_gia', 5)
            ->assertJsonPath('data.su_kien_theo_chuyen_de.0.tong_luot_tham_du', 5);
    }

    public function test_no_show_list_uses_minimum_threshold_three_and_returns_exact_count_without_pii(): void
    {
        $faculty = DonViToChuc::query()->where('loai_don_vi', 'Khoa')->firstOrFail();
        $qualifyingStudent = $this->createStudent($faculty, '23520031', 'Lê Minh Đạt');
        $belowThresholdStudent = $this->createStudent($faculty, '23520032', 'Phạm Gia Hân');

        $this->createNoShowViolations($qualifyingStudent, 3);
        $this->createNoShowViolations($belowThresholdStudent, 2);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/analytics/no-show-violations');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.mssv', '23520031')
            ->assertJsonPath('data.0.ho_ten', 'Lê Minh Đạt')
            ->assertJsonPath('data.0.so_lan_vi_pham', 3)
            ->assertJsonMissingPath('data.1')
            ->assertJsonMissingPath('data.0.email')
            ->assertJsonMissingPath('data.0.so_dien_thoai')
            ->assertJsonStructure(['success', 'data', 'meta', 'message']);
        $this->assertSame(
            ['mssv', 'ho_ten', 'khoa', 'so_lan_vi_pham'],
            array_keys($response->json('data.0'))
        );
    }

    public function test_no_show_list_can_filter_by_faculty(): void
    {
        $faculties = DonViToChuc::query()->where('loai_don_vi', 'Khoa')->take(2)->get();
        $this->assertCount(2, $faculties);

        $firstStudent = $this->createStudent($faculties[0], '23520033', 'Vũ Anh Khoa');
        $secondStudent = $this->createStudent($faculties[1], '23520034', 'Đỗ Bảo Ngọc');
        $this->createNoShowViolations($firstStudent, 3);
        $this->createNoShowViolations($secondStudent, 3);

        $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/analytics/no-show-violations?ma_khoa='.$faculties[0]->ma_don_vi_to_chuc)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.mssv', '23520033');
    }

    public function test_no_show_list_returns_pagination_metadata(): void
    {
        $faculty = DonViToChuc::query()->where('loai_don_vi', 'Khoa')->firstOrFail();
        $students = [
            $this->createStudent($faculty, '23520035', 'Nguyễn Hà My'),
            $this->createStudent($faculty, '23520036', 'Trần Quốc Bảo'),
            $this->createStudent($faculty, '23520037', 'Mai Thu Trang'),
        ];

        foreach ($students as $student) {
            $this->createNoShowViolations($student, 3);
        }

        $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/analytics/no-show-violations?page=2&limit=2')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.trang_hien_tai', 2)
            ->assertJsonPath('meta.kich_thuoc_trang', 2)
            ->assertJsonPath('meta.tong_so_ban_ghi', 3)
            ->assertJsonPath('meta.tong_so_trang', 2);
    }

    public function test_no_show_list_searches_by_student_number_or_full_name(): void
    {
        $faculty = DonViToChuc::query()->where('loai_don_vi', 'Khoa')->firstOrFail();
        $student = $this->createStudent($faculty, '23520038', 'Đặng Hoàng Long');
        $this->createNoShowViolations($student, 1);

        foreach (['23520038', 'Hoàng Long'] as $query) {
            $this->actingAs($this->admin)
                ->getJson('/api/v1/admin/analytics/no-show-violations?so_lan_toi_thieu=1&q='.urlencode($query))
                ->assertOk()
                ->assertJsonCount(1, 'data')
                ->assertJsonPath('data.0.mssv', '23520038');
        }
    }

    public function test_macro_dashboard_query_completes_under_one_second_with_thousands_of_daily_rows(): void
    {
        $event = $this->createReportEvent();
        $rows = [];
        $now = now()->toDateTimeString();

        for ($index = 0; $index < 3000; $index++) {
            $rows[] = [
                'ngay_thong_ke' => Carbon::today()->subDays($index)->toDateString(),
                'ma_su_kien' => $event->ma_su_kien,
                'tong_ve_phat_hanh' => 100,
                'tong_ve_dang_ky' => 80,
                'tong_luot_tham_du' => 70,
                'tong_luot_check_out' => 65,
                'tong_luot_no_show' => 5,
                'so_phut_chay_ve' => 120,
                'diem_hai_long_trung_binh' => 4.5,
                'thoi_gian_cap_nhat' => $now,
            ];

            if (count($rows) === 500) {
                DB::table('thong_ke_su_kien_ngay')->insert($rows);
                $rows = [];
            }
        }

        if ($rows !== []) {
            DB::table('thong_ke_su_kien_ngay')->insert($rows);
        }

        $startedAt = microtime(true);
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/analytics/macro?tu_ngay='.Carbon::today()->subDays(89)->toDateString().'&den_ngay='.Carbon::yesterday()->toDateString());
        $elapsedSeconds = microtime(true) - $startedAt;

        fwrite(STDOUT, sprintf("Macro dashboard query on 3,000 summary rows: %.4f seconds\n", $elapsedSeconds));

        $response->assertOk();
        $this->assertLessThan(1.0, $elapsedSeconds, 'Macro dashboard query exceeded the 1.0 second NFR-PERF-03 limit.');
    }

    private function createStudent(DonViToChuc $faculty, string $mssv, string $name): User
    {
        return User::query()->create([
            'mssv' => $mssv,
            'email' => $mssv.'@gm.uit.edu.vn',
            'ho_ten' => $name,
            'mat_khau' => Hash::make(Str::random(24)),
            'ma_khoa' => $faculty->ma_don_vi_to_chuc,
            'khoa' => $faculty->ten_don_vi,
            'lop_sinh_hoat' => 'HTTT2023',
            'loai_tai_khoan' => 'SinhVien',
            'dong_y_nghi_dinh_13' => true,
            'buoc_doi_mat_khau' => false,
            'hoat_dong' => true,
        ]);
    }

    private function createNoShowViolations(User $student, int $count): void
    {
        $baseEvent = $this->createReportEvent();

        for ($index = 0; $index < $count; $index++) {
            $event = $this->createReportEvent($baseEvent);

            DangKy::query()->create([
                'ma_su_kien' => $event->ma_su_kien,
                'ma_tai_khoan' => $student->ma_tai_khoan,
                'ma_ve_uuid' => (string) Str::uuid(),
                'chu_ky_hmac' => str_repeat('a', 64),
                'trang_thai' => 'DaDangKy',
                'thoi_gian_dang_ky' => now()->subDays(6),
                'vi_pham_no_show' => true,
            ]);
        }
    }

    private function seedDailyStatistics(SuKien $event, array $statistics): void
    {
        $now = now()->toDateTimeString();

        foreach ($statistics as $statistic) {
            DB::table('thong_ke_su_kien_ngay')->insert([
                'ngay_thong_ke' => $statistic['ngay_thong_ke'],
                'ma_su_kien' => $event->ma_su_kien,
                'tong_ve_phat_hanh' => 100,
                'tong_ve_dang_ky' => 10,
                'tong_luot_tham_du' => $statistic['tong_luot_tham_du'],
                'tong_luot_check_out' => 8,
                'tong_luot_no_show' => 1,
                'so_phut_chay_ve' => 30,
                'diem_hai_long_trung_binh' => 4.0,
                'thoi_gian_cap_nhat' => $now,
            ]);
        }
    }

    private function createReportEvent(?SuKien $basedOn = null): SuKien
    {
        $basedOn ??= new SuKien([
            'ma_chuyen_de' => ChuyenDe::query()->firstOrFail()->ma_chuyen_de,
            'ma_don_vi_to_chuc' => DonViToChuc::query()->firstOrFail()->ma_don_vi_to_chuc,
            'ma_phong' => PhongHoiTruong::query()->firstOrFail()->ma_phong,
        ]);

        $startTime = now()->addDays(10)->setTime(10, 0);

        return SuKien::query()->create([
            'ten_su_kien' => 'Macro report '.Str::uuid(),
            'mo_ta' => 'Fixture for macro analytics',
            'ma_chuyen_de' => $basedOn->ma_chuyen_de,
            'ma_don_vi_to_chuc' => $basedOn->ma_don_vi_to_chuc,
            'ma_phong' => $basedOn->ma_phong,
            'ngay_cong_bo' => now()->subDay(),
            'thoi_gian_bat_dau' => $startTime,
            'thoi_gian_ket_thuc' => $startTime->copy()->addHours(2),
            'so_luong_toi_da' => 100,
            'so_ve_con_lai' => 100,
            'khong_gioi_han_slot' => false,
            'diem_drl_du_kien' => 5,
            'dieu_khoan_drl' => 'Dieu3',
            'trang_thai' => 'COMPLETED',
        ]);
    }
}
