<?php

namespace App\Services;

use App\Models\DangKy;
use App\Models\HangDoiWaitlist;
use App\Models\SuKien;
use App\Models\User;

class EventSmartActionService
{
    /**
     * Doc du lieu ve va waitlist cua sinh vien tu database.
     * Chi doc du lieu, khong them, sua hoac xoa.
     */
    public function forEvent(SuKien $event, ?User $user): array
    {
        $ticket = null;
        $waitlist = null;

        if ($user && $user->isSinhVien()) {
            // Tim ve con hieu luc cua sinh vien.
            $ticket = DangKy::query()
                ->where('ma_su_kien', $event->ma_su_kien)
                ->where('ma_tai_khoan', $user->ma_tai_khoan)
                ->where('trang_thai', '!=', 'DaHuy')
                ->first();

            // Tim trang thai waitlist hien tai.
            $waitlist = HangDoiWaitlist::query()
                ->where('ma_su_kien', $event->ma_su_kien)
                ->where('ma_tai_khoan', $user->ma_tai_khoan)
                ->whereIn('trang_thai', [
                    'WAITING',
                    'OFFERED',
                ])
                ->orderByDesc('id')
                ->first();
        }

        // Chuyen sang ham tinh trang thai nut bam.
        return $this->decide(
            $event,
            $user,
            $ticket,
            $waitlist
        );
    }

    /**
     * Tinh trang thai Smart Action Button.
     *
     * Ham nay khong truy van va khong ghi database.
     * Co the truyen Model gia lap de kiem thu.
     */
    public function decide(
        SuKien $event,
        ?User $user,
        ?DangKy $ticket,
        ?HangDoiWaitlist $waitlist
    ): array {
        $now = now();

        /*
         * 1. Su kien da ket thuc.
         */
        if (
            $event->trang_thai === 'COMPLETED'
            || $now->gte($event->thoi_gian_ket_thuc)
        ) {
            // Kiem tra dieu kien tham gia hop le.
            $validAttendance = (
                $event->trang_thai === 'COMPLETED'
                && $ticket
                && $ticket->trang_thai === 'DaCheckOut'
                && $ticket->da_check_in
                && $ticket->da_check_out
                && (float) $ticket->ti_le_drl > 0
            );

            if ($validAttendance) {
                $extra = [
                    'ma_dang_ky' => (int) $ticket->ma_dang_ky,
                ];

                // Da feedback: kiem tra dieu kien chung nhan.
                if ($ticket->da_feedback) {
                    return $this->action(
                        'LAM_FEEDBACK_NHAN_CERT',
                        $ticket->du_dieu_kien_drl
                            ? 'Xem chứng nhận của tôi'
                            : 'Chưa đủ điều kiện nhận chứng nhận',
                        (bool) $ticket->du_dieu_kien_drl,
                        $extra
                    );
                }

                // Chua feedback: kiem tra han 48 gio.
                $deadline = $event->thoi_gian_ket_thuc
                    ->copy()
                    ->addHours(48);

                $withinDeadline = $now->lte($deadline);

                // Hoac dang trong thoi gian an han.
                $withinGrace = (
                    $ticket->han_an_han_feedback
                    && $now->lte($ticket->han_an_han_feedback)
                );

                if ($withinDeadline || $withinGrace) {
                    return $this->action(
                        'LAM_FEEDBACK_NHAN_CERT',
                        'Làm khảo sát đánh giá sự kiện',
                        true,
                        $extra
                    );
                }
            }

            return $this->action(
                'SU_KIEN_DA_KET_THUC',
                'Sự kiện đã kết thúc',
                false
            );
        }

        /*
         * 2. Khach chua dang nhap.
         */
        if (!$user) {
            return $this->action(
                'CHUA_DANG_NHAP',
                'Đăng nhập để tham gia',
                true
            );
        }

        /*
         * 3. Tai khoan khong phai sinh vien.
         */
        if (!$user->isSinhVien()) {
            return $this->action(
                'DANG_KY',
                'Chỉ tài khoản sinh viên được đăng ký',
                false
            );
        }

        /*
         * 4. Sinh vien da co ve.
         */
        if ($ticket) {
            // Su kien dang dien ra va da mo cong diem danh.
            if (
                $event->trang_thai === 'HAPPENING'
                && $event->cong_check_in_mo
                && !$ticket->da_check_in
            ) {
                return $this->action(
                    'VAO_DIEM_DANH',
                    'Vào điểm danh',
                    true,
                    [
                        'ma_dang_ky' => (int) $ticket->ma_dang_ky,
                    ]
                );
            }

            return $this->action(
                'DA_CO_VE',
                'Xem vé của tôi',
                true,
                [
                    'ma_dang_ky' => (int) $ticket->ma_dang_ky,
                ]
            );
        }

        /*
         * 5. Sinh vien duoc moi nhan suat tu waitlist.
         */
        // Offer da het han: khoa nut trong khi cho tac vu nen cap nhat.
        if (
            $waitlist
            && $waitlist->trang_thai === 'OFFERED'
            && (
                !$waitlist->han_chot_xac_nhan
                || $now->gte($waitlist->han_chot_xac_nhan)
            )
        ) {
            return $this->action(
                'CO_OFFER_WAITLIST',
                'Suất chờ đã hết hạn, vui lòng tải lại trạng thái',
                false,
                [
                    'ma_hang_doi' => (int) $waitlist->id,
                    'so_giay_offer_con_lai' => 0,
                ]
            );
        }

        if (
            $waitlist
            && $waitlist->trang_thai === 'OFFERED'
            && $waitlist->han_chot_xac_nhan
            && $now->lt($waitlist->han_chot_xac_nhan)
        ) {
            return $this->action(
                'CO_OFFER_WAITLIST',
                'Xác nhận suất tham gia',
                true,
                [
                    'ma_hang_doi' => (int) $waitlist->id,

                    'han_chot_offer' => $waitlist
                        ->han_chot_xac_nhan
                        ->copy()
                        ->setTimezone('Asia/Ho_Chi_Minh')
                        ->toIso8601String(),

                    'so_giay_offer_con_lai' => max(
                        0,
                        $waitlist->han_chot_xac_nhan
                            ->getTimestamp()
                            - $now->getTimestamp()
                    ),
                ]
            );
        }

        /*
         * 6. Sinh vien dang o trong waitlist.
         */
        if (
            $waitlist
            && $waitlist->trang_thai === 'WAITING'
        ) {
            return $this->action(
                'DANG_O_WAITLIST',
                'Bạn đang trong danh sách chờ',
                false,
                [
                    'ma_hang_doi' => (int) $waitlist->id,
                    'so_thu_tu_waitlist' => (int) $waitlist->so_thu_tu,
                ]
            );
        }

        /*
         * 7. Su kien khong gioi han so luong.
         */
        // Chua den ngay cong bo: khong cho dang ky.
        if (
            $event->ngay_cong_bo
            && $now->lt($event->ngay_cong_bo)
        ) {
            return $this->action(
                'DANG_KY',
                'Chưa đến thời gian mở đăng ký',
                false
            );
        }

        if ($event->khong_gioi_han_slot) {
            return $this->action(
                'DANG_KY',
                'Đăng ký tham gia ngay',
                true
            );
        }

        /*
         * 8. Su kien gioi han ve dang dien ra.
         */
        if ($event->trang_thai === 'HAPPENING') {
            return $this->action(
                'SU_KIEN_DANG_DIEN_RA_DONG_DK',
                'Sự kiện đang diễn ra, đã đóng đăng ký',
                false
            );
        }

        /*
         * 9. Tinh moc dong dang ky T - 2 gio.
         */
        $cutoff = $event->thoi_gian_bat_dau
            ->copy()
            ->subHours(2);

        /*
         * 10. Da qua moc T - 2 gio.
         */
        if ($now->gte($cutoff)) {
            if ((int) $event->so_ve_con_lai <= 0) {
                return $this->action(
                    'HET_VE_DONG_WAITLIST_T2H',
                    'Hết vé và đã đóng danh sách chờ',
                    false
                );
            }

            return $this->action(
                'DONG_DANG_KY_T2H',
                'Đã đóng đăng ký trước 2 giờ',
                false
            );
        }

        /*
         * 11. Het ve nhung chua den T - 2 gio.
         */
        if ((int) $event->so_ve_con_lai <= 0) {
            return $this->action(
                'VAO_WAITLIST',
                'Tham gia danh sách chờ',
                true
            );
        }

        /*
         * 12. Con ve va dang mo dang ky.
         */
        return $this->action(
            'DANG_KY',
            'Đăng ký tham gia ngay',
            true
        );
    }

    /**
     * Tao cau truc nut bam dung API Contract.
     */
    private function action(
        string $state,
        string $message,
        bool $enabled,
        array $extra = []
    ): array {
        return array_merge(
            [
                'trang_thai_nut' => $state,
                'thong_diep_nut' => $message,
                'cho_phep_bam' => $enabled,
            ],
            $extra
        );
    }
}
