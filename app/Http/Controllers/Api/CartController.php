<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Product;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index(Request $request)
    {
        $items = Cart::with('product')
            ->where('user_id', $request->user()->id)
            ->get();

        $total = $items->sum(function ($item) {
            return $item->product->price * $item->quantity;
        });

        return response()->json([
            'items' => $items,
            'total' => round($total, 2),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $product = Product::findOrFail($validated['product_id']);

        if ($product->stock < $validated['quantity']) {
            return response()->json(['message' => 'Insufficient stock.'], 422);
        }

        $cartItem = Cart::where('user_id', $request->user()->id)
            ->where('product_id', $validated['product_id'])
            ->first();

        if ($cartItem) {
            $newQty = $cartItem->quantity + $validated['quantity'];
            if ($product->stock < $newQty) {
                return response()->json(['message' => 'Insufficient stock.'], 422);
            }
            $cartItem->update(['quantity' => $newQty]);
        } else {
            $cartItem = Cart::create([
                'user_id' => $request->user()->id,
                'product_id' => $validated['product_id'],
                'quantity' => $validated['quantity'],
            ]);
        }

        $cartItem->load('product');

        return response()->json($cartItem, 201);
    }

    public function update(Request $request, Cart $cart)
    {
        if ($cart->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $product = Product::findOrFail($cart->product_id);

        if ($product->stock < $validated['quantity']) {
            return response()->json(['message' => 'Insufficient stock.'], 422);
        }

        $cart->update(['quantity' => $validated['quantity']]);
        $cart->load('product');

        return response()->json($cart);
    }

    public function destroy(Request $request, Cart $cart)
    {
        if ($cart->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $cart->delete();

        return response()->json(['message' => 'Item removed from cart.']);
    }

    public function clear(Request $request)
    {
        Cart::where('user_id', $request->user()->id)->delete();

        return response()->json(['message' => 'Cart cleared.']);
    }
}
