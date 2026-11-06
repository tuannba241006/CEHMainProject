<?php

namespace Tests\Feature;

use App\Models\ChuyenDe;
use App\Models\DonViToChuc;
use App\Models\PhongHoiTruong;
use App\Models\SuKien;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class Pkg04DiscoveryFeatureTest extends TestCase
{
    use DatabaseTransactions;

    private SuKien $laravelEvent;

    private SuKien $pythonEvent;

    private SuKien $happeningEvent;

    private SuKien $completedEvent;

    private SuKien $draftEvent;

    private DonViToChuc $host;

    private ChuyenDe $topic;

    private PhongHoiTruong $room;

    protected function setUp(): void
    {
        parent::setUp();

        // Chan tuyet doi viec tao du lieu tren database chinh.
        if (DB::connection()->getDatabaseName() !== 'ceh_test') {
            throw new \RuntimeException(
                'PKG04 TEST BI CHAN: Chi duoc su dung database ceh_test!'
            );
        }

        // Tao du lieu danh muc rieng cho moi test.
        $this->host = DonViToChuc::create([
            'ten_don_vi' => 'PKG04 Feature Test Host',
            'ma_dinh_danh' => 'PKG04_FEATURE_HOST',
            'loai_don_vi' => 'CLB',
            'hoat_dong' => 1,
        ]);

        $this->topic = ChuyenDe::create([
            'ten_chuyen_de' => 'PKG04 Feature Test Topic',
            'mo_ta' => 'Chuyen de kiem thu PKG04',
            'da_xoa' => 0,
        ]);

        $this->room = PhongHoiTruong::create([
            'ten_phong' => 'PKG04 Feature Test Room',
            'co_so' => 'CoSo1',
            'suc_chua_toi_da' => 100,
            'trang_thai' => 'KhaDung',
        ]);

        $this->laravelEvent = $this->createEvent([
            'ten_su_kien' => 'PKG04 Auto Workshop Laravel',
        ]);

        $this->pythonEvent = $this->createEvent([
            'ten_su_kien' => 'PKG04 Auto Workshop Python',
        ]);

        $this->happeningEvent = $this->createEvent([
            'ten_su_kien' => 'PKG04 Auto Event Happening',
            'trang_thai' => 'HAPPENING',
            'thoi_gian_bat_dau' => now()->subHour(),
            'thoi_gian_ket_thuc' => now()->addHours(2),
        ]);

        $this->completedEvent = $this->createEvent([
            'ten_su_kien' => 'PKG04 Auto Event Completed',
            'trang_thai' => 'COMPLETED',
            'ngay_cong_bo' => now()->subDays(5),
            'thoi_gian_bat_dau' => now()->subDays(3),
            'thoi_gian_ket_thuc' => now()->subDays(2),
        ]);

        $this->draftEvent = $this->createEvent([
            'ten_su_kien' => 'PKG04 Auto Secret Draft',
            'trang_thai' => 'DRAFT',
        ]);
    }

    private function createEvent(array $overrides = []): SuKien
    {
        return SuKien::create(array_merge([
            'ma_don_vi_to_chuc' => $this->host->ma_don_vi_to_chuc,
            'ma_chuyen_de' => $this->topic->ma_chuyen_de,
            'ma_phong' => $this->room->ma_phong,
            'ten_su_kien' => 'PKG04 Auto Test Event',
            'mo_ta' => 'Du lieu tu dong kiem thu PKG04',
            'ngay_cong_bo' => now()->subDay(),
            'thoi_gian_bat_dau' => now()->addDays(5),
            'thoi_gian_ket_thuc' => now()->addDays(5)->addHours(2),
            'khong_gioi_han_slot' => false,
            'so_luong_toi_da' => 50,
            'so_ve_con_lai' => 50,
            'so_slot_dong_bang' => 0,
            'dieu_khoan_drl' => 'KhongCo',
            'diem_drl_du_kien' => 0,
            'gio_tinh_nguyen' => 0,
            'trang_thai' => 'PUBLISHED',
        ], $overrides));
    }

    public function test_public_event_list_hides_drafts(): void
    {
        $response = $this->getJson('/api/v1/events');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertSee('PKG04 Auto Workshop Laravel')
            ->assertSee('PKG04 Auto Workshop Python')
            ->assertSee('PKG04 Auto Event Happening')
            ->assertDontSee('PKG04 Auto Secret Draft');
    }

    public function test_short_keyword_search_filters_events(): void
    {
        $response = $this->getJson(
            '/api/v1/events?q=La'
        );

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertSee('PKG04 Auto Workshop Laravel')
            ->assertDontSee('PKG04 Auto Workshop Python');
    }

    public function test_invalid_limit_returns_422(): void
    {
        $this->getJson('/api/v1/events?limit=999')
            ->assertStatus(422);
    }

    public function test_public_event_detail_returns_correct_data(): void
    {
        $id = $this->laravelEvent->ma_su_kien;

        $this->getJson("/api/v1/events/{$id}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath(
                'data.ten_su_kien',
                'PKG04 Auto Workshop Laravel'
            )
            ->assertJsonPath(
                'data.trang_thai',
                'PUBLISHED'
            )
            ->assertJsonPath(
                'data.nut_bam_dieu_huong.trang_thai_nut',
                'CHUA_DANG_NHAP'
            );
    }

    public function test_draft_and_unknown_events_return_404(): void
    {
        $draftId = $this->draftEvent->ma_su_kien;

        $this->getJson("/api/v1/events/{$draftId}")
            ->assertNotFound();

        $this->getJson('/api/v1/events/999999999')
            ->assertNotFound();
    }

    public function test_completed_event_detail_is_public(): void
    {
        $id = $this->completedEvent->ma_su_kien;

        $this->getJson("/api/v1/events/{$id}")
            ->assertOk()
            ->assertJsonPath(
                'data.trang_thai',
                'COMPLETED'
            )
            ->assertJsonPath(
                'data.nut_bam_dieu_huong.trang_thai_nut',
                'SU_KIEN_DA_KET_THUC'
            );
    }

    public function test_share_page_contains_opengraph_tags(): void
    {
        $id = $this->laravelEvent->ma_su_kien;

        $this->get("/api/v1/events/{$id}/share")
            ->assertOk()
            ->assertHeader('Content-Type', 'text/html; charset=UTF-8')
            ->assertSee('og:title')
            ->assertSee('og:description')
            ->assertSee('og:image')
            ->assertSee('og:url')
            ->assertSee('PKG04 Auto Workshop Laravel');

        $draftId = $this->draftEvent->ma_su_kien;

        $this->get("/api/v1/events/{$draftId}/share")
            ->assertNotFound();
    }

    public function test_logged_in_student_gets_register_action(): void
    {
        $student = User::create([
            'mssv' => '22990004',
            'email' => 'pkg04_feature_student@example.test',
            'ho_ten' => 'PKG04 Feature Student',
            'mat_khau' => Hash::make('Test@12345'),
            'khoa' => 'Khoa He thong Thong tin',
            'loai_tai_khoan' => 'SinhVien',
            'dong_y_nghi_dinh_13' => 1,
            'hoat_dong' => 1,
            'buoc_doi_mat_khau' => 0,
        ]);

        $id = $this->laravelEvent->ma_su_kien;

        $this->actingAs($student)
            ->getJson("/api/v1/events/{$id}")
            ->assertOk()
            ->assertJsonPath(
                'data.nut_bam_dieu_huong.trang_thai_nut',
                'DANG_KY'
            )
            ->assertJsonPath(
                'data.nut_bam_dieu_huong.cho_phep_bam',
                true
            );
    }
}
