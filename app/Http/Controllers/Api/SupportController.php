<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Services\ZenConnectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class SupportController extends Controller
{
    public function __construct(protected ZenConnectService $zenConnect)
    {
    }

    /**
     * Get all support tickets for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Sync tickets from ZenConnect
        $this->syncTicketsFromZenConnect($user);

        $tickets = SupportTicket::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'tickets' => $tickets,
        ]);
    }

    /**
     * Create a new support ticket.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'category' => 'sometimes|nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'message' => $validator->errors()->first(),
                'messages' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        // Create ticket in ZenConnect
        $zenConnectResponse = $this->zenConnect->createTicket([
            'title' => $request->title,
            'description' => $request->description,
            'priority' => $request->priority ?? 'medium',
            'category_slug' => $request->category ?? 'general-inquiry',
            'customer_id' => (string) $user->id,
            'customer_email' => $user->email,
            'customer_name' => $user->name,
        ]);

        // Build ticket data — use ZenConnect response if available, otherwise store locally
        $ticketData = [
            'user_id' => $user->id,
            'title' => $request->title,
            'description' => $request->description,
            'priority' => $request->priority ?? 'medium',
            'category' => $request->category,
            'status' => 'open',
        ];

        if ($zenConnectResponse) {
            $ticketData['zenconnect_id'] = $zenConnectResponse['ticket']['id'];
            $ticketData['ticket_number'] = $zenConnectResponse['ticket']['ticket_number'];
            $ticketData['status'] = $zenConnectResponse['ticket']['status'];
            $ticketData['priority'] = $zenConnectResponse['ticket']['priority'] ?? 'medium';
            $ticketData['last_synced_at'] = now();
        }

        $ticket = SupportTicket::create($ticketData);

        return response()->json([
            'message' => 'Support ticket created successfully',
            'ticket' => $ticket,
        ], 201);
    }

    /**
     * Get a specific ticket with comments.
     */
    public function show(Request $request, SupportTicket $ticket): JsonResponse
    {
        // Verify ownership
        if ($ticket->user_id !== $request->user()->id) {
            return response()->json([
                'error' => 'Unauthorized',
            ], 403);
        }

        // Fetch latest from ZenConnect
        $zenConnectData = $this->zenConnect->getTicket($ticket->zenconnect_id);

        if ($zenConnectData) {
            $ticket->update([
                'status' => $zenConnectData['ticket']['status'],
                'assigned_agent' => $zenConnectData['ticket']['assigned_to'],
                'resolved_at' => $zenConnectData['ticket']['resolved_at']
                    ? \Carbon\Carbon::parse($zenConnectData['ticket']['resolved_at'])
                    : null,
                'last_synced_at' => now(),
            ]);

            return response()->json([
                'ticket' => $ticket->fresh(),
                'comments' => $zenConnectData['ticket']['comments'] ?? [],
            ]);
        }

        return response()->json([
            'ticket' => $ticket,
            'comments' => [],
        ]);
    }

    /**
     * Add a comment to a ticket.
     */
    public function addComment(Request $request, SupportTicket $ticket): JsonResponse
    {
        // Verify ownership
        if ($ticket->user_id !== $request->user()->id) {
            return response()->json([
                'error' => 'Unauthorized',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'body' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        $response = $this->zenConnect->addComment(
            $ticket->zenconnect_id,
            (string) $user->id,
            $request->body
        );

        if (!$response) {
            return response()->json([
                'error' => 'Failed to add comment',
                'message' => 'Please try again later',
            ], 500);
        }

        return response()->json([
            'message' => 'Comment added successfully',
            'comment' => $response['comment'],
        ], 201);
    }

    /**
     * Get available support categories.
     */
    public function categories(): JsonResponse
    {
        $categories = $this->zenConnect->getCategories();

        return response()->json([
            'categories' => $categories['categories'] ?? [],
        ]);
    }

    /**
     * Handle webhook from ZenConnect.
     */
    public function webhook(Request $request): JsonResponse
    {
        $signature = $request->header('X-Webhook-Signature');
        $event = $request->header('X-Webhook-Event');
        $payload = $request->getContent();

        // Verify signature
        if (!$this->zenConnect->verifyWebhookSignature($payload, $signature ?? '')) {
            Log::warning('ZenConnect webhook signature verification failed');
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $data = $request->all();

        Log::info('ZenConnect webhook received', [
            'event' => $event,
            'ticket_id' => $data['ticket_id'] ?? null,
        ]);

        switch ($event) {
            case 'ticket.comment_added':
                $this->handleCommentAdded($data);
                break;

            case 'ticket.status_changed':
                $this->handleStatusChanged($data);
                break;

            case 'ticket.assigned':
                $this->handleTicketAssigned($data);
                break;

            case 'ticket.resolved':
                $this->handleTicketResolved($data);
                break;
        }

        return response()->json(['received' => true]);
    }

    /**
     * Sync tickets from ZenConnect for a user.
     */
    protected function syncTicketsFromZenConnect($user): void
    {
        $response = $this->zenConnect->getCustomerTickets((string) $user->id);

        if (!$response || !isset($response['tickets'])) {
            return;
        }

        foreach ($response['tickets'] as $zenTicket) {
            SupportTicket::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'zenconnect_id' => $zenTicket['id'],
                ],
                [
                    'ticket_number' => $zenTicket['ticket_number'],
                    'title' => $zenTicket['title'],
                    'description' => $zenTicket['description'],
                    'status' => $zenTicket['status'],
                    'priority' => $zenTicket['priority'],
                    'category' => $zenTicket['category'],
                    'assigned_agent' => $zenTicket['assigned_to'],
                    'resolved_at' => $zenTicket['resolved_at']
                        ? \Carbon\Carbon::parse($zenTicket['resolved_at'])
                        : null,
                    'last_synced_at' => now(),
                ]
            );
        }
    }

    /**
     * Handle comment added webhook.
     */
    protected function handleCommentAdded(array $data): void
    {
        $ticket = SupportTicket::where('zenconnect_id', $data['ticket_id'])->first();

        if ($ticket) {
            $ticket->update([
                'status' => $data['ticket_status'] ?? $ticket->status,
                'last_synced_at' => now(),
            ]);

            // Here you could also trigger a notification to the user
            // $ticket->user->notify(new SupportTicketReplied($ticket, $data['comment']));
        }
    }

    /**
     * Handle status changed webhook.
     */
    protected function handleStatusChanged(array $data): void
    {
        $ticket = SupportTicket::where('zenconnect_id', $data['ticket_id'])->first();

        if ($ticket) {
            $ticket->update([
                'status' => $data['new_status'],
                'last_synced_at' => now(),
            ]);
        }
    }

    /**
     * Handle ticket assigned webhook.
     */
    protected function handleTicketAssigned(array $data): void
    {
        $ticket = SupportTicket::where('zenconnect_id', $data['ticket_id'])->first();

        if ($ticket) {
            $ticket->update([
                'assigned_agent' => $data['assigned_to'],
                'last_synced_at' => now(),
            ]);
        }
    }

    /**
     * Handle ticket resolved webhook.
     */
    protected function handleTicketResolved(array $data): void
    {
        $ticket = SupportTicket::where('zenconnect_id', $data['ticket_id'])->first();

        if ($ticket) {
            $ticket->update([
                'status' => 'resolved',
                'resolved_at' => $data['resolved_at']
                    ? \Carbon\Carbon::parse($data['resolved_at'])
                    : now(),
                'last_synced_at' => now(),
            ]);
        }
    }
}
