<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ZenConnectService
{
    protected string $baseUrl;
    protected string $apiKey;
    protected string $apiSecret;

    public function __construct()
    {
        $this->baseUrl = config('services.zenconnect.url', 'http://localhost:8000');
        $this->apiKey = config('services.zenconnect.api_key', '');
        $this->apiSecret = config('services.zenconnect.api_secret', '');
    }

    /**
     * Create a support ticket in ZenConnect.
     */
    public function createTicket(array $data): ?array
    {
        try {
            $response = Http::timeout(15)
                ->withHeaders($this->getHeaders())
                ->post("{$this->baseUrl}/api/external/tickets", $data);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('ZenConnect createTicket failed', [
                'status' => $response->status(),
                'response' => $response->json(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('ZenConnect createTicket exception', [
                'message' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Get all tickets for a customer.
     */
    public function getCustomerTickets(string $customerId, ?string $status = null): ?array
    {
        try {
            $params = ['customer_id' => $customerId];
            if ($status) {
                $params['status'] = $status;
            }

            $response = Http::timeout(15)
                ->withHeaders($this->getHeaders())
                ->get("{$this->baseUrl}/api/external/tickets", $params);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('ZenConnect getCustomerTickets failed', [
                'status' => $response->status(),
                'response' => $response->json(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('ZenConnect getCustomerTickets exception', [
                'message' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Get a single ticket with comments.
     */
    public function getTicket(int $ticketId): ?array
    {
        try {
            $response = Http::timeout(15)
                ->withHeaders($this->getHeaders())
                ->get("{$this->baseUrl}/api/external/tickets/{$ticketId}");

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('ZenConnect getTicket failed', [
                'status' => $response->status(),
                'response' => $response->json(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('ZenConnect getTicket exception', [
                'message' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Add a comment to a ticket.
     */
    public function addComment(int $ticketId, string $customerId, string $body): ?array
    {
        try {
            $response = Http::timeout(15)
                ->withHeaders($this->getHeaders())
                ->post("{$this->baseUrl}/api/external/tickets/{$ticketId}/comments", [
                    'customer_id' => $customerId,
                    'body' => $body,
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('ZenConnect addComment failed', [
                'status' => $response->status(),
                'response' => $response->json(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('ZenConnect addComment exception', [
                'message' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Get available categories.
     */
    public function getCategories(): ?array
    {
        try {
            $response = Http::timeout(15)
                ->withHeaders($this->getHeaders())
                ->get("{$this->baseUrl}/api/external/categories");

            if ($response->successful()) {
                return $response->json();
            }

            return null;
        } catch (\Exception $e) {
            Log::error('ZenConnect getCategories exception', [
                'message' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Verify webhook signature.
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        $webhookSecret = config('services.zenconnect.webhook_secret');
        $expectedSignature = hash_hmac('sha256', $payload, $webhookSecret);
        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Get request headers.
     */
    protected function getHeaders(): array
    {
        return [
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
            'X-Api-Key' => $this->apiKey,
            'X-Api-Secret' => $this->apiSecret,
        ];
    }
}
