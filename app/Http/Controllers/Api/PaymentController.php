<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\Cart;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class PaymentController extends Controller
{
    protected string $keyId;
    protected string $keySecret;

    public function __construct()
    {
        $this->keyId = config('services.razorpay.key_id');
        $this->keySecret = config('services.razorpay.key_secret');
    }

    /**
     * Create a Razorpay order for checkout
     */
    public function createOrder(Request $request)
    {
        $cartItems = Cart::with('product')
            ->where('user_id', $request->user()->id)
            ->get();

        if ($cartItems->isEmpty()) {
            return response()->json(['message' => 'Cart is empty.'], 422);
        }

        // Calculate total
        $totalPrice = 0;
        foreach ($cartItems as $item) {
            if ($item->product->stock < $item->quantity) {
                return response()->json([
                    'message' => "Insufficient stock for {$item->product->name}.",
                ], 422);
            }
            $totalPrice += $item->product->price * $item->quantity;
        }

        // Amount in paise (Razorpay expects smallest currency unit)
        $amountInPaise = (int) round($totalPrice * 100);

        // Create Razorpay order via API
        $response = Http::withBasicAuth($this->keyId, $this->keySecret)
            ->post('https://api.razorpay.com/v1/orders', [
                'amount' => $amountInPaise,
                'currency' => 'INR',
                'receipt' => 'order_' . time() . '_' . $request->user()->id,
                'notes' => [
                    'user_id' => $request->user()->id,
                ],
            ]);

        if ($response->failed()) {
            return response()->json([
                'message' => 'Failed to create payment order.',
                'error' => $response->json(),
            ], 500);
        }

        $razorpayOrder = $response->json();

        return response()->json([
            'order_id' => $razorpayOrder['id'],
            'amount' => $razorpayOrder['amount'],
            'currency' => $razorpayOrder['currency'],
            'key_id' => $this->keyId,
        ]);
    }

    /**
     * Verify payment and create order
     */
    public function verifyPayment(Request $request)
    {
        $request->validate([
            'razorpay_order_id' => 'required|string',
            'razorpay_payment_id' => 'required|string',
            'razorpay_signature' => 'required|string',
            'address_id' => 'required|exists:addresses,id',
        ]);

        // Verify the address belongs to the user
        $address = Address::where('id', $request->address_id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$address) {
            return response()->json(['message' => 'Invalid shipping address.'], 422);
        }

        // Verify signature
        $expectedSignature = hash_hmac(
            'sha256',
            $request->razorpay_order_id . '|' . $request->razorpay_payment_id,
            $this->keySecret
        );

        if ($expectedSignature !== $request->razorpay_signature) {
            return response()->json(['message' => 'Invalid payment signature.'], 400);
        }

        // Payment verified - now create the order
        $cartItems = Cart::with('product')
            ->where('user_id', $request->user()->id)
            ->get();

        if ($cartItems->isEmpty()) {
            return response()->json(['message' => 'Cart is empty.'], 422);
        }

        return DB::transaction(function () use ($request, $cartItems, $address) {
            $totalPrice = 0;

            foreach ($cartItems as $item) {
                $product = $item->product;

                if ($product->stock < $item->quantity) {
                    return response()->json([
                        'message' => "Insufficient stock for {$product->name}.",
                    ], 422);
                }

                $totalPrice += $product->price * $item->quantity;
            }

            $order = Order::create([
                'user_id' => $request->user()->id,
                'total_price' => $totalPrice,
                'status' => 'pending',
                'razorpay_order_id' => $request->razorpay_order_id,
                'razorpay_payment_id' => $request->razorpay_payment_id,
                'payment_status' => 'paid',
                'shipping_name' => $address->full_name,
                'shipping_phone' => $address->phone,
                'shipping_address' => $address->address_line1 . ($address->address_line2 ? ', ' . $address->address_line2 : ''),
                'shipping_city' => $address->city,
                'shipping_state' => $address->state,
                'shipping_pincode' => $address->pincode,
            ]);

            foreach ($cartItems as $item) {
                $order->items()->create([
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                    'price' => $item->product->price,
                ]);

                $item->product->decrement('stock', $item->quantity);
            }

            Cart::where('user_id', $request->user()->id)->delete();

            $order->load('items.product');

            return response()->json([
                'message' => 'Payment successful! Order placed.',
                'order' => $order,
            ], 201);
        });
    }

    /**
     * Get Razorpay key for frontend
     */
    public function getKey()
    {
        return response()->json([
            'key_id' => $this->keyId,
        ]);
    }
}
