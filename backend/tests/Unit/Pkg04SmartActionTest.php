<?php

namespace Tests\Unit;

use App\Models\DangKy;
use App\Models\HangDoiWaitlist;
use App\Models\SuKien;
use App\Models\User;
use App\Services\EventSmartActionService;
use Tests\TestCase;

class Pkg04SmartActionTest extends TestCase
{
    private EventSmartActionService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new EventSmartActionService;
    }

    private function event(array $changes = []): SuKien
    {
        $start = now()->addDays(3);

        return new SuKien(array_merge([
            'ma_su_kien' => 999999,
            'trang_thai' => 'PUBLISHED',
            'khong_gioi_han_slot' => false,
            'so_ve_con_lai' => 10,
            'thoi_gian_bat_dau' => $start,
            'thoi_gian_ket_thuc' => $start->copy()->addHours(2),
            'cong_check_in_mo' => false,
        ], $changes));
    }

    private function student(): User
    {
        return new User([
            'ma_tai_khoan' => 999999,
            'loai_tai_khoan' => 'SinhVien',
        ]);
    }

    private function assertAction(
        string $expected,
        SuKien $event,
        ?User $user = null,
        ?DangKy $ticket = null,
        ?HangDoiWaitlist $waitlist = null
    ): array {
        $result = $this->service->decide(
            $event,
            $user,
            $ticket,
            $waitlist
        );

        $this->assertSame(
            $expected,
            $result['trang_thai_nut']
        );

        $this->assertArrayHasKey('thong_diep_nut', $result);
        $this->assertArrayHasKey('cho_phep_bam', $result);

        return $result;
    }

    public function test_guest_and_completed_event(): void
    {
        $result = $this->assertAction(
            'CHUA_DANG_NHAP',
            $this->event()
        );

        $this->assertTrue($result['cho_phep_bam']);

        $this->assertAction(
            'SU_KIEN_DA_KET_THUC',
            $this->event([
                'trang_thai' => 'COMPLETED',
            ])
        );
    }

    public function test_student_registration_states(): void
    {
        $student = $this->student();

        $this->assertAction(
            'DANG_KY',
            $this->event(),
            $student
        );

        $this->assertAction(
            'VAO_WAITLIST',
            $this->event(['so_ve_con_lai' => 0]),
            $student
        );

        $this->assertAction(
            'DANG_KY',
            $this->event([
                'khong_gioi_han_slot' => true,
                'trang_thai' => 'HAPPENING',
                'thoi_gian_bat_dau' => now()->subHour(),
                'thoi_gian_ket_thuc' => now()->addHour(),
            ]),
            $student
        );

        $this->assertAction(
            'SU_KIEN_DANG_DIEN_RA_DONG_DK',
            $this->event([
                'trang_thai' => 'HAPPENING',
                'thoi_gian_bat_dau' => now()->subHour(),
                'thoi_gian_ket_thuc' => now()->addHour(),
            ]),
            $student
        );
    }

    public function test_registration_closes_two_hours_before_start(): void
    {
        $student = $this->student();

        $event = $this->event([
            'so_ve_con_lai' => 10,
            'thoi_gian_bat_dau' => now()->addMinutes(90),
            'thoi_gian_ket_thuc' => now()->addMinutes(210),
        ]);

        $this->assertAction(
            'DONG_DANG_KY_T2H',
            $event,
            $student
        );

        $event->so_ve_con_lai = 0;

        $this->assertAction(
            'HET_VE_DONG_WAITLIST_T2H',
            $event,
            $student
        );
    }

    public function test_ticket_checkin_and_feedback_states(): void
    {
        $student = $this->student();

        $ticket = new DangKy([
            'ma_dang_ky' => 101,
            'trang_thai' => 'DaDangKy',
            'da_check_in' => false,
            'da_check_out' => false,
        ]);

        $result = $this->assertAction(
            'DA_CO_VE',
            $this->event(),
            $student,
            $ticket
        );

        $this->assertSame(101, $result['ma_dang_ky']);

        $happening = $this->event([
            'trang_thai' => 'HAPPENING',
            'cong_check_in_mo' => true,
            'thoi_gian_bat_dau' => now()->subHour(),
            'thoi_gian_ket_thuc' => now()->addHour(),
        ]);

        $this->assertAction(
            'VAO_DIEM_DANH',
            $happening,
            $student,
            $ticket
        );

        $ticket->da_check_in = true;
        $ticket->da_check_out = true;
        $ticket->trang_thai = 'DaCheckOut';
        $ticket->ti_le_drl = 1.00;

        $this->assertAction(
            'LAM_FEEDBACK_NHAN_CERT',
            $this->event([
                'trang_thai' => 'COMPLETED',
            ]),
            $student,
            $ticket
        );
    }

    public function test_waitlist_and_offer_states(): void
    {
        $student = $this->student();

        $waiting = new HangDoiWaitlist([
            'id' => 201,
            'trang_thai' => 'WAITING',
            'so_thu_tu' => 3,
        ]);

        $result = $this->assertAction(
            'DANG_O_WAITLIST',
            $this->event(),
            $student,
            null,
            $waiting
        );

        $this->assertSame(3, $result['so_thu_tu_waitlist']);

        $offered = new HangDoiWaitlist([
            'id' => 202,
            'trang_thai' => 'OFFERED',
            'han_chot_xac_nhan' => now()->addMinutes(30),
        ]);

        $result = $this->assertAction(
            'CO_OFFER_WAITLIST',
            $this->event(),
            $student,
            null,
            $offered
        );

        $this->assertSame(202, $result['ma_hang_doi']);

        $this->assertGreaterThan(
            0,
            $result['so_giay_offer_con_lai']
        );

        // Offer het han khong duoc xac nhan.
        $offered->han_chot_xac_nhan = now()->subMinute();

        $expiredResult = $this->service->decide(
            $this->event(['so_ve_con_lai' => 0]),
            $student,
            null,
            $offered
        );

        $this->assertSame(
            'CO_OFFER_WAITLIST',
            $expiredResult['trang_thai_nut']
        );
        $this->assertFalse($expiredResult['cho_phep_bam']);
        $this->assertSame(0, $expiredResult['so_giay_offer_con_lai']);
    }

    public function test_registration_disabled_before_publication(): void
    {
        foreach ([false, true] as $unlimited) {
            $event = $this->event([
                'ngay_cong_bo' => now()->addDay(),
                'khong_gioi_han_slot' => $unlimited,
                'so_luong_toi_da' => $unlimited ? null : 50,
                'so_ve_con_lai' => $unlimited ? null : 10,
            ]);

            $result = $this->assertAction(
                'DANG_KY',
                $event,
                $this->student()
            );

            $this->assertFalse($result['cho_phep_bam']);
            $this->assertSame(
                'Chưa đến thời gian mở đăng ký',
                $result['thong_diep_nut']
            );
        }
    }

    public function test_feedback_eligibility_and_deadline(): void
    {
        $student = $this->student();

        $ticket = new DangKy([
            'ma_dang_ky' => 301,
            'trang_thai' => 'DaCheckOut',
            'da_check_in' => true,
            'da_check_out' => true,
            'ti_le_drl' => 1.00,
            'da_feedback' => false,
            'du_dieu_kien_drl' => false,
        ]);

        $event = $this->event([
            'trang_thai' => 'COMPLETED',
            'thoi_gian_bat_dau' => now()->subHours(75),
            'thoi_gian_ket_thuc' => now()->subHours(72),
        ]);

        // Da qua 48 gio: khong duoc feedback.
        $result = $this->service->decide(
            $event, $student, $ticket, null
        );

        $this->assertSame(
            'SU_KIEN_DA_KET_THUC',
            $result['trang_thai_nut']
        );

        // Duoc admin cap an han.
        $ticket->han_an_han_feedback = now()->addHour();

        $result = $this->service->decide(
            $event, $student, $ticket, null
        );

        $this->assertSame(
            'LAM_FEEDBACK_NHAN_CERT',
            $result['trang_thai_nut']
        );
        $this->assertTrue($result['cho_phep_bam']);

        // Da feedback va du dieu kien chung nhan.
        $ticket->da_feedback = true;
        $ticket->du_dieu_kien_drl = true;

        $result = $this->service->decide(
            $event, $student, $ticket, null
        );

        $this->assertSame(
            'LAM_FEEDBACK_NHAN_CERT',
            $result['trang_thai_nut']
        );
        $this->assertTrue($result['cho_phep_bam']);

        // Khong du dieu kien nhan chung nhan.
        $ticket->du_dieu_kien_drl = false;

        $result = $this->service->decide(
            $event, $student, $ticket, null
        );

        $this->assertFalse($result['cho_phep_bam']);

        // Thoi luong tham du khong hop le.
        $ticket->da_feedback = false;
        $ticket->ti_le_drl = 0;

        $result = $this->service->decide(
            $event, $student, $ticket, null
        );

        $this->assertSame(
            'SU_KIEN_DA_KET_THUC',
            $result['trang_thai_nut']
        );
    }

    public function test_non_student_cannot_register(): void
    {
        $organizer = new User([
            'loai_tai_khoan' => 'ToChuc',
        ]);

        $result = $this->assertAction(
            'DANG_KY',
            $this->event(),
            $organizer
        );

        $this->assertFalse($result['cho_phep_bam']);
    }
}
