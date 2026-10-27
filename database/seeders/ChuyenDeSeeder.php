<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ChuyenDeSeeder extends Seeder
{
    /**
     * Seed danh mục Chuyên đề: Công nghệ, Học thuật, Kỹ năng mềm, Khởi nghiệp, Tình nguyện.
     */
    public function run(): void
    {
        $now = now();

        $chuyenDe = [
            [
                'ma_chuyen_de' => 1,
                'ten_chuyen_de' => 'Công nghệ',
                'mo_ta' => 'Hội thảo, workshop về công nghệ mới, lập trình, trí tuệ nhân tạo, an toàn thông tin',
                'da_xoa' => 0,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            [
                'ma_chuyen_de' => 2,
                'ten_chuyen_de' => 'Học thuật',
                'mo_ta' => 'Nghiên cứu khoa học, seminar học thuật, ôn tập chuyên ngành',
                'da_xoa' => 0,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            [
                'ma_chuyen_de' => 3,
                'ten_chuyen_de' => 'Kỹ năng mềm',
                'mo_ta' => 'Giao tiếp, thuyết trình, làm việc nhóm, quản lý thời gian',
                'da_xoa' => 0,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            [
                'ma_chuyen_de' => 4,
                'ten_chuyen_de' => 'Khởi nghiệp',
                'mo_ta' => 'Chia sẻ từ các founder, chuyên gia khởi nghiệp công nghệ, pitch deck',
                'da_xoa' => 0,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
            [
                'ma_chuyen_de' => 5,
                'ten_chuyen_de' => 'Tình nguyện',
                'mo_ta' => 'Chiến dịch tình nguyện, hoạt động cộng đồng, hiến máu nhân đạo, mùa hè xanh',
                'da_xoa' => 0,
                'thoi_gian_tao' => $now,
                'thoi_gian_cap_nhat' => $now,
            ],
        ];

        foreach ($chuyenDe as $cd) {
            DB::table('chuyen_de')->updateOrInsert(
                ['ma_chuyen_de' => $cd['ma_chuyen_de']],
                $cd
            );
        }
    }
}
