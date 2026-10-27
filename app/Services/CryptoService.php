<?php

namespace App\Services;

class CryptoService
{
    /**
     * Get the HMAC secret key from application configuration.
     */
    protected function getSecretKey(): string
    {
        $key = (string) config('app.key');
        if (str_starts_with($key, 'base64:')) {
            $decoded = base64_decode(substr($key, 7), true);
            if ($decoded !== false) {
                return $decoded;
            }
        }

        return $key;
    }

    /**
     * Sign ticket payload with HMAC-SHA256 (UC-OPS-02, NFR-SEC-02).
     * Format: "{uuid}|{userId}|{eventId}"
     */
    public function signTicket(string $uuid, int $userId, int $eventId): string
    {
        $payload = "{$uuid}|{$userId}|{$eventId}";

        return hash_hmac('sha256', $payload, $this->getSecretKey());
    }

    /**
     * Constant-time verification of ticket HMAC signature.
     */
    public function verifyTicket(string $signature, string $uuid, int $userId, int $eventId): bool
    {
        $expectedSignature = $this->signTicket($uuid, $userId, $eventId);

        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Hash OTP code with SHA-256 (UC-AUTH-01, UC-AUTH-04).
     */
    public function hashOtp(string $plainOtp): string
    {
        return hash('sha256', $plainOtp);
    }

    /**
     * Sign e-Certificate with HMAC-SHA256 (UC-CERT-01).
     * Format: "{regId}|{userId}|{eventId}"
     */
    public function signCertificate(int $regId, int $userId, int $eventId): string
    {
        $payload = "{$regId}|{$userId}|{$eventId}";

        return hash_hmac('sha256', $payload, $this->getSecretKey());
    }

    /**
     * Constant-time verification of certificate hash.
     */
    public function verifyCertificate(string $hash, int $regId, int $userId, int $eventId): bool
    {
        $expectedHash = $this->signCertificate($regId, $userId, $eventId);

        return hash_equals($expectedHash, $hash);
    }
}
