<?php

namespace Tests\Feature\Architecture;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ApiResponseTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Register dummy routes to test ApiResponseTrait and Global Exception Handlers
        Route::get('/api/test-envelope-success', function () {
            $controller = new class extends Controller {};

            return $controller->successResponse(['id' => 123], 'Thao tác thành công');
        });

        Route::get('/api/test-envelope-error', function () {
            $controller = new class extends Controller {};

            return $controller->errorResponse('CUSTOM_ERROR', 'Đã xảy ra lỗi kiểm tra', ['field' => 'Invalid']);
        });

        Route::get('/api/test-exception-validation', function () {
            throw ValidationException::withMessages([
                'email' => ['Email không đúng định dạng trường.'],
            ]);
        });

        Route::get('/api/test-exception-auth', function () {
            throw new AuthenticationException('Unauthenticated.');
        });

        Route::get('/api/test-exception-forbidden', function () {
            throw new AuthorizationException('Bạn không có quyền thực hiện.');
        });

        Route::get('/api/test-exception-model-not-found', function () {
            $exception = new ModelNotFoundException;
            $exception->setModel(User::class, [9999]);
            throw $exception;
        });

        Route::get('/api/test-exception-throttle', function () {
            throw new ThrottleRequestsException('Too Many Attempts.', null, ['Retry-After' => 60]);
        });
    }

    public function test_success_response_envelope(): void
    {
        $response = $this->getJson('/api/test-envelope-success');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Thao tác thành công',
                'data' => [
                    'id' => 123,
                ],
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'server_time',
            ]);
    }

    public function test_error_response_envelope(): void
    {
        $response = $this->getJson('/api/test-envelope-error');

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'error' => 'CUSTOM_ERROR',
                'message' => 'Đã xảy ra lỗi kiểm tra',
                'details' => [
                    'field' => 'Invalid',
                ],
            ]);
    }

    public function test_global_exception_validation_error(): void
    {
        $response = $this->getJson('/api/test-exception-validation');

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error' => 'VALIDATION_FAILED',
                'message' => 'Dữ liệu cung cấp không hợp lệ.',
            ])
            ->assertJsonStructure([
                'success',
                'error',
                'message',
                'errors' => ['email'],
                'details' => ['email'],
            ]);
    }

    public function test_global_exception_authentication_error(): void
    {
        $response = $this->getJson('/api/test-exception-auth');

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'error' => 'UNAUTHENTICATED',
            ]);
    }

    public function test_global_exception_authorization_forbidden(): void
    {
        $response = $this->getJson('/api/test-exception-forbidden');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error' => 'FORBIDDEN',
            ]);
    }

    public function test_global_exception_model_not_found(): void
    {
        $response = $this->getJson('/api/test-exception-model-not-found');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'error' => 'RESOURCE_NOT_FOUND',
            ]);
    }

    public function test_global_exception_throttle_rate_limit(): void
    {
        $response = $this->getJson('/api/test-exception-throttle');

        $response->assertStatus(429)
            ->assertJson([
                'success' => false,
                'error' => 'RATE_LIMIT_EXCEEDED',
            ])
            ->assertHeader('Retry-After', '60');
    }
}
