<?php

namespace Tests\Feature\Security;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

final class SecureImageUploadTest extends TestCase
{
    private function userWithRole(string $role): User
    {
        return User::create([
            'email' => 'secure-upload-'.Str::random(12).'@gm.uit.edu.vn',
            'mssv' => $role === 'SinhVien' ? '2252'.random_int(1000, 9999) : null,
            'ho_ten' => 'Upload QA',
            'mat_khau' => Hash::make('StrongPassword@123'),
            'loai_tai_khoan' => $role,
            'hoat_dong' => true,
            'buoc_doi_mat_khau' => false,
            'dong_y_nghi_dinh_13' => true,
        ]);
    }

    public function test_student_can_upload_avatar_png(): void
    {
        Storage::fake('public');
        $user = $this->userWithRole('SinhVien');
        $response = $this->actingAs($user)->post('/api/v1/uploads/images', [
            'loai' => 'avatar',
            'file' => UploadedFile::fake()->image('portrait.png', 128, 128),
        ], ['Accept' => 'application/json']);
        $response->assertCreated()->assertJsonPath('success', true);
        $this->assertCount(1, Storage::disk('public')->files('uploads/avatar'));
    }

    public function test_student_cannot_upload_a_poster(): void
    {
        Storage::fake('public');
        $user = $this->userWithRole('SinhVien');
        $response = $this->actingAs($user)->post('/api/v1/uploads/images', [
            'loai' => 'poster',
            'file' => UploadedFile::fake()->image('poster.png', 128, 128),
        ], ['Accept' => 'application/json']);
        $response->assertForbidden()->assertJsonPath('error', 'FORBIDDEN');
        $this->assertSame([], Storage::disk('public')->allFiles('uploads'));
    }

    public function test_admin_can_upload_a_poster_with_legacy_route_alias(): void
    {
        Storage::fake('public');
        $user = $this->userWithRole('Admin');
        $response = $this->actingAs($user)->post('/api/uploads/images', [
            'loai' => 'poster',
            'file' => UploadedFile::fake()->image('poster.jpg', 128, 128),
        ], ['Accept' => 'application/json']);
        $response->assertCreated()->assertJsonPath('success', true);
        $this->assertCount(1, Storage::disk('public')->files('uploads/poster'));
    }

    public function test_svg_is_rejected(): void
    {
        Storage::fake('public');
        $user = $this->userWithRole('Admin');
        $this->actingAs($user)->post('/api/v1/uploads/images', [
            'loai' => 'poster',
            'file' => UploadedFile::fake()->create('image.svg', 1, 'image/svg+xml'),
        ], ['Accept' => 'application/json'])->assertUnprocessable();
    }

    public function test_image_larger_than_4096_pixels_is_rejected(): void
    {
        Storage::fake('public');
        $user = $this->userWithRole('Admin');
        $this->actingAs($user)->post('/api/v1/uploads/images', [
            'loai' => 'poster',
            'file' => UploadedFile::fake()->image('large.png', 4097, 64),
        ], ['Accept' => 'application/json'])->assertUnprocessable();
    }
}
