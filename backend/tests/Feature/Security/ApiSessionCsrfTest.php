<?php

namespace Tests\Feature\Security;

use App\Http\Middleware\VerifyApiSessionCsrf;
use Illuminate\Http\Request;
use Tests\TestCase;

class ApiSessionCsrfTest extends TestCase
{
    public function test_mutating_browser_cookie_requests_are_checked_and_safe_methods_are_not(): void
    {
        $middleware = $this->app->make(VerifyApiSessionCsrf::class);
        $cookie = (string) config('session.cookie');

        $post = Request::create('/api/v1/attendance/manual-override', 'POST', [], [$cookie => 'encrypted-cookie']);
        $get = Request::create('/api/v1/attendance/manual-override', 'GET', [], [$cookie => 'encrypted-cookie']);
        $this->assertTrue($middleware->shouldCheck($post));
        $this->assertFalse($middleware->shouldCheck($get));
    }

    public function test_login_without_existing_session_cookie_still_requires_csrf(): void
    {
        $middleware = $this->app->make(VerifyApiSessionCsrf::class);
        $this->assertTrue($middleware->shouldCheck(Request::create('/api/v1/auth/login', 'POST')));
        $this->assertTrue($middleware->shouldCheck(Request::create('/api/auth/login', 'POST')));
    }

    public function test_token_only_request_without_session_cookie_remains_compatible(): void
    {
        $middleware = $this->app->make(VerifyApiSessionCsrf::class);
        $request = Request::create('/api/v1/events/1/book', 'POST', [], [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer example-token',
        ]);
        $this->assertFalse($middleware->shouldCheck($request));
    }

    public function test_a_bearer_header_does_not_exempt_a_request_with_session_cookie(): void
    {
        $middleware = $this->app->make(VerifyApiSessionCsrf::class);
        $cookie = (string) config('session.cookie');
        $request = Request::create('/api/v1/attendance/manual-override', 'POST', [], [$cookie => 'encrypted-cookie'], [], [
            'HTTP_AUTHORIZATION' => 'Bearer sample-token',
        ]);
        $this->assertTrue($middleware->shouldCheck($request));
    }
}
