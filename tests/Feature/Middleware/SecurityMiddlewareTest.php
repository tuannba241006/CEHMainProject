<?php

namespace Tests\Feature\Middleware;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class SecurityMiddlewareTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();

        // Set up test routes with middleware
        Route::middleware(['web', 'auth', 'single.session'])->get('/test/single-session', function () {
            return response()->json(['success' => true]);
        });

        Route::middleware(['api', 'role:Admin'])->get('/api/test/admin-only', function () {
            return response()->json(['success' => true, 'message' => 'Admin Access Granted']);
        });

        Route::middleware(['api', 'role:Admin,ToChuc'])->get('/api/test/admin-or-organizer', function () {
            return response()->json(['success' => true, 'message' => 'Staff Access Granted']);
        });

        Route::middleware(['api', 'auth', 'password.changed'])->group(function () {
            Route::get('/api/v1/auth/me', function () {
                return response()->json(['success' => true, 'message' => 'User Profile']);
            });

            Route::put('/api/v1/auth/change-password', function () {
                return response()->json(['success' => true, 'message' => 'Password Changed']);
            });

            Route::post('/api/v1/auth/logout', function () {
                return response()->json(['success' => true, 'message' => 'Logged Out']);
            });

            Route::get('/api/v1/events/list', function () {
                return response()->json(['success' => true, 'message' => 'Events List']);
            });
        });
    }

    public function test_ensure_single_active_session_cleans_other_sessions_for_student(): void
    {
        $student = User::where('loai_tai_khoan', 'SinhVien')->first();
        $this->assertNotNull($student);

        // Create an old session in the database
        DB::table('sessions')->insert([
            'id' => 'old_student_session_id',
            'user_id' => $student->ma_tai_khoan,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'OldBrowser/1.0',
            'payload' => 'dummy',
            'last_activity' => time() - 3600,
        ]);

        $this->actingAs($student);

        // Make request with active session
        $response = $this->withSession(['active' => true])->get('/test/single-session');
        $response->assertStatus(200);

        // Verify old session was purged
        $this->assertDatabaseMissing('sessions', [
            'id' => 'old_student_session_id',
            'user_id' => $student->ma_tai_khoan,
        ]);
    }

    public function test_ensure_single_active_session_preserves_concurrent_sessions_for_admin(): void
    {
        $admin = User::where('loai_tai_khoan', 'Admin')->first();
        $this->assertNotNull($admin);

        // Create an old session for admin
        DB::table('sessions')->insert([
            'id' => 'old_admin_session_id',
            'user_id' => $admin->ma_tai_khoan,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'OldBrowser/1.0',
            'payload' => 'dummy',
            'last_activity' => time() - 3600,
        ]);

        $this->actingAs($admin);

        $response = $this->withSession(['active' => true])->get('/test/single-session');
        $response->assertStatus(200);

        // Verify old admin session is STILL present (Admin supports multi-session)
        $this->assertDatabaseHas('sessions', [
            'id' => 'old_admin_session_id',
            'user_id' => $admin->ma_tai_khoan,
        ]);
    }

    public function test_rbac_middleware_allows_authorized_role(): void
    {
        $admin = User::where('loai_tai_khoan', 'Admin')->first();
        $this->assertNotNull($admin);

        $response = $this->actingAs($admin)->getJson('/api/test/admin-only');
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Admin Access Granted',
            ]);
    }

    public function test_rbac_middleware_blocks_unauthorized_role(): void
    {
        $student = User::where('loai_tai_khoan', 'SinhVien')->first();
        $this->assertNotNull($student);

        $response = $this->actingAs($student)->getJson('/api/test/admin-only');
        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => 'FORBIDDEN',
            ]);
    }

    public function test_rbac_middleware_allows_multiple_configured_roles(): void
    {
        $organizer = User::where('loai_tai_khoan', 'ToChuc')->first();
        $this->assertNotNull($organizer);

        $response = $this->actingAs($organizer)->getJson('/api/test/admin-or-organizer');
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Staff Access Granted',
            ]);
    }

    public function test_rbac_middleware_returns_unauthenticated_when_no_user(): void
    {
        $response = $this->getJson('/api/test/admin-only');
        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'error' => 'UNAUTHENTICATED',
            ]);
    }

    public function test_password_middleware_blocks_locked_account(): void
    {
        $user = new User([
            'ma_tai_khoan' => 999,
            'email' => 'locked@uit.edu.vn',
            'hoat_dong' => 0,
            'buoc_doi_mat_khau' => 0,
            'loai_tai_khoan' => 'SinhVien',
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/events/list');
        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => 'ACCOUNT_LOCKED',
            ]);
    }

    public function test_password_middleware_enforces_password_change_for_new_internal_accounts(): void
    {
        $user = new User([
            'ma_tai_khoan' => 998,
            'email' => 'internal@uit.edu.vn',
            'hoat_dong' => 1,
            'buoc_doi_mat_khau' => 1,
            'loai_tai_khoan' => 'ToChuc',
        ]);

        // General protected route should be blocked
        $response = $this->actingAs($user)->getJson('/api/v1/events/list');
        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => 'PASSWORD_CHANGE_REQUIRED',
            ]);

        // Whitelisted routes must be accessible
        $responseMe = $this->actingAs($user)->getJson('/api/v1/auth/me');
        $responseMe->assertStatus(200);

        $responseChange = $this->actingAs($user)->putJson('/api/v1/auth/change-password');
        $responseChange->assertStatus(200);

        $responseLogout = $this->actingAs($user)->postJson('/api/v1/auth/logout');
        $responseLogout->assertStatus(200);
    }
}
