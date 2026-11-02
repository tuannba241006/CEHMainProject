<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            ALTER TABLE `su_kien`
            MODIFY COLUMN `trang_thai` ENUM(
                'DRAFT',
                'WAITING_COHOST_CONFIRM',
                'COHOST_REJECTED',
                'PENDING_FACULTY',
                'PENDING_ADMIN',
                'REJECTED_FACULTY',
                'REJECTED_ADMIN',
                'APPROVED',
                'REJECTED',
                'PUBLISHED',
                'HAPPENING',
                'COMPLETED',
                'CANCELLED'
            ) NOT NULL DEFAULT 'DRAFT'
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE `su_kien`
            MODIFY COLUMN `trang_thai` ENUM(
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
            ) NOT NULL DEFAULT 'DRAFT'
        ");
    }
};