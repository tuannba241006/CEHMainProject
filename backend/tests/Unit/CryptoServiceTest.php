<?php

namespace Tests\Unit;

use App\Services\CryptoService;
use Tests\TestCase;

class CryptoServiceTest extends TestCase
{
    protected CryptoService $cryptoService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->cryptoService = new CryptoService;
    }

    public function test_sign_and_verify_ticket_success(): void
    {
        $uuid = '550e8400-e29b-41d4-a716-446655440000';
        $userId = 101;
        $eventId = 202;

        $signature = $this->cryptoService->signTicket($uuid, $userId, $eventId);

        $this->assertIsString($signature);
        $this->assertEquals(64, strlen($signature), 'HMAC-SHA256 signature must be 64 hex characters.');

        $isValid = $this->cryptoService->verifyTicket($signature, $uuid, $userId, $eventId);
        $this->assertTrue($isValid, 'Valid ticket signature should verify successfully.');
    }

    public function test_verify_ticket_fails_on_tampered_payload_or_signature(): void
    {
        $uuid = '550e8400-e29b-41d4-a716-446655440000';
        $userId = 101;
        $eventId = 202;

        $signature = $this->cryptoService->signTicket($uuid, $userId, $eventId);

        // Tamper signature
        $tamperedSignature = substr_replace($signature, '0', 0, 1);
        $this->assertFalse($this->cryptoService->verifyTicket($tamperedSignature, $uuid, $userId, $eventId));

        // Tamper event ID
        $this->assertFalse($this->cryptoService->verifyTicket($signature, $uuid, $userId, 999));

        // Tamper user ID
        $this->assertFalse($this->cryptoService->verifyTicket($signature, $uuid, 999, $eventId));

        // Tamper UUID
        $this->assertFalse($this->cryptoService->verifyTicket($signature, '00000000-0000-0000-0000-000000000000', $userId, $eventId));
    }

    public function test_hash_otp(): void
    {
        $plainOtp = '123456';
        $hash = $this->cryptoService->hashOtp($plainOtp);

        $this->assertEquals(hash('sha256', '123456'), $hash);
        $this->assertEquals(64, strlen($hash));
    }

    public function test_sign_and_verify_certificate(): void
    {
        $regId = 15;
        $userId = 101;
        $eventId = 202;

        $certHash = $this->cryptoService->signCertificate($regId, $userId, $eventId);

        $this->assertEquals(64, strlen($certHash));
        $this->assertTrue($this->cryptoService->verifyCertificate($certHash, $regId, $userId, $eventId));
        $this->assertFalse($this->cryptoService->verifyCertificate($certHash, $regId, 999, $eventId));
    }
}
