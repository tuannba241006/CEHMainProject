<?php

namespace Tests\Feature\Security;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StepUpAuthenticationTest extends TestCase
{
    public function test_sensitive_attendance_edit_requires_recent_password_confirmation(): void
    {
        config()->set('ceh_security.step_up_enabled', true);
        // TestCase seeds ceh_test. Do not depend on admin password from fixtures.
        $user = User::where('loai_tai_khoan', 'Admin')->firstOrFail();
        $user->mat_khau = Hash::make('SecretTest#2026');
        $user->buoc_doi_mat_khau = false;
        $user->hoat_dong = true;
        $user->save();
        $this->actingAs($user);

        $this->postJson('/api/v1/attendance/manual-override', [])
            ->assertStatus(428)->assertJsonPath('error', 'REAUTHENTICATION_REQUIRED');

        $this->postJson('/api/v1/auth/confirm-sensitive-action', ['mat_khau' => 'wrong-password'])
            ->assertStatus(401)->assertJsonPath('error', 'INVALID_CREDENTIALS');

        $this->postJson('/api/v1/auth/confirm-sensitive-action', ['mat_khau' => 'SecretTest#2026'])
            ->assertOk()->assertJsonPath('success', true);

        // Middleware now passes, and the existing FormRequest rejects empty payload.
        $this->postJson('/api/v1/attendance/manual-override', [])
            ->assertStatus(422);
    }

    private function prepareAdmin(): User
    {
        config()->set('ceh_security.step_up_enabled', true);
        $user = User::where('loai_tai_khoan', 'Admin')->firstOrFail();
        $user->mat_khau = Hash::make('SecretTest#2026');
        $user->buoc_doi_mat_khau = false;
        $user->hoat_dong = true;
        $user->save();
        $this->actingAs($user);

        return $user;
    }

    public function test_all_four_sensitive_api_routes_require_reauthentication(): void
    {
        $this->prepareAdmin();
        $routes = [
            ['PUT', '/api/v1/admin/users/999999/assign-organizer'],
            ['POST', '/api/v1/attendance/manual-override'],
            ['POST', '/api/v1/admin/certificates/999999/revoke'],
            ['POST', '/api/v1/events/999999/drl/unlock'],
            ['POST', '/api/attendance/manual-override'],
        ];

        foreach ($routes as [$method, $uri]) {
            $this->json($method, $uri, [])
                ->assertStatus(428)
                ->assertJsonPath('error', 'REAUTHENTICATION_REQUIRED');
        }
    }

    public function test_step_up_proof_expires_after_ttl(): void
    {
        $this->prepareAdmin();
        config()->set('ceh_security.step_up_ttl_seconds', 300);
        $this->postJson('/api/v1/auth/confirm-sensitive-action', ['mat_khau' => 'SecretTest#2026'])
            ->assertOk();
        $this->postJson('/api/v1/attendance/manual-override', [])->assertStatus(422);
        $this->travel(301)->seconds();
        $this->postJson('/api/v1/attendance/manual-override', [])
            ->assertStatus(428);
    }

    public function test_change_password_invalidates_step_up_proof(): void
    {
        $this->prepareAdmin();
        $this->postJson('/api/v1/auth/confirm-sensitive-action', ['mat_khau' => 'SecretTest#2026'])
            ->assertOk();
        $this->postJson('/api/v1/attendance/manual-override', [])->assertStatus(422);

        $this->postJson('/api/v1/auth/change-password', [
            'mat_khau_hien_tai' => 'SecretTest#2026',
            'mat_khau_moi' => 'AnotherSecret#2026',
            'xac_nhan_mat_khau_moi' => 'AnotherSecret#2026',
        ])->assertOk();

        $this->postJson('/api/v1/attendance/manual-override', [])
            ->assertStatus(428)->assertJsonPath('error', 'REAUTHENTICATION_REQUIRED');
    }

    public function test_password_hash_change_in_another_session_invalidates_step_up_proof(): void
    {
        $user = $this->prepareAdmin();
        $this->postJson('/api/v1/auth/confirm-sensitive-action', ['mat_khau' => 'SecretTest#2026'])
            ->assertOk();
        $user->mat_khau = Hash::make('ResetElsewhere#2026');
        $user->save();
        $this->postJson('/api/v1/attendance/manual-override', [])
            ->assertStatus(428);
    }

    public function test_step_up_proof_is_not_shared_after_session_flush(): void
    {
        $this->prepareAdmin();
        $this->postJson('/api/v1/auth/confirm-sensitive-action', ['mat_khau' => 'SecretTest#2026'])
            ->assertOk();
        $this->flushSession();
        $this->postJson('/api/v1/attendance/manual-override', [])
            ->assertStatus(428);
    }

    public function test_admin_routes_remain_forbidden_to_student(): void
    {
        config()->set('ceh_security.step_up_enabled', true);
        $student = User::where('loai_tai_khoan', 'SinhVien')->firstOrFail();
        $student->hoat_dong = true;
        $student->buoc_doi_mat_khau = false;
        $student->save();
        $this->actingAs($student);
        $this->postJson('/api/v1/admin/certificates/999999/revoke', [])
            ->assertStatus(403);
    }
}
