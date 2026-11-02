<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Add emergency override audit actions.
     */
    public function up(): void
    {
        // Remove the old CHECK constraint before changing its conditions.
        DB::statement(
            'ALTER TABLE `nhat_ky_kiem_duyet`
             DROP CHECK `chk_kiemduyet_lydo`'
        );

        // Preserve all existing ENUM values and append two new actions.
        DB::statement("
            ALTER TABLE `nhat_ky_kiem_duyet`
            MODIFY COLUMN `hanh_dong` ENUM(
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
                'UNLOCK_ACCOUNT',
                'GRANT_EMERGENCY_OVERRIDE',
                'REVOKE_EMERGENCY_OVERRIDE'
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
        ");

        // Restore the old reason rules and require a reason for the new actions.
        DB::statement("
            ALTER TABLE `nhat_ky_kiem_duyet`
            ADD CONSTRAINT `chk_kiemduyet_lydo` CHECK (
                (
                    `hanh_dong` NOT IN (
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
                        'LOCK_ACCOUNT',
                        'GRANT_EMERGENCY_OVERRIDE',
                        'REVOKE_EMERGENCY_OVERRIDE'
                    )
                    OR (
                        `ly_do` IS NOT NULL
                        AND CHAR_LENGTH(TRIM(`ly_do`)) > 0
                    )
                )
                AND (
                    `hanh_dong` NOT IN ('REJECT_FACULTY', 'REJECT_ADMIN')
                    OR CHAR_LENGTH(`ly_do`) >= 10
                )
            )
        ");
    }

    /**
     * Revert emergency override audit actions.
     */
    public function down(): void
    {
        // Do not remove ENUM values while existing audit records use them.
        $usedActions = DB::table('nhat_ky_kiem_duyet')
            ->whereIn('hanh_dong', [
                'GRANT_EMERGENCY_OVERRIDE',
                'REVOKE_EMERGENCY_OVERRIDE',
            ])
            ->count();

        if ($usedActions > 0) {
            throw new RuntimeException(
                'Cannot rollback: emergency override audit records already exist.'
            );
        }

        DB::statement(
            'ALTER TABLE `nhat_ky_kiem_duyet`
             DROP CHECK `chk_kiemduyet_lydo`'
        );

        // Restore the original 25 ENUM values.
        DB::statement("
            ALTER TABLE `nhat_ky_kiem_duyet`
            MODIFY COLUMN `hanh_dong` ENUM(
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
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
        ");

        // Restore the original CHECK constraint.
        DB::statement("
            ALTER TABLE `nhat_ky_kiem_duyet`
            ADD CONSTRAINT `chk_kiemduyet_lydo` CHECK (
                (
                    `hanh_dong` NOT IN (
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
                    )
                    OR (
                        `ly_do` IS NOT NULL
                        AND CHAR_LENGTH(TRIM(`ly_do`)) > 0
                    )
                )
                AND (
                    `hanh_dong` NOT IN ('REJECT_FACULTY', 'REJECT_ADMIN')
                    OR CHAR_LENGTH(`ly_do`) >= 10
                )
            )
        ");
    }
};