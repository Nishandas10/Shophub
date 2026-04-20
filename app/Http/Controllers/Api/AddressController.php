<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    /**
     * Get all addresses for authenticated user
     */
    public function index(Request $request)
    {
        $addresses = $request->user()->addresses()
            ->orderByDesc('is_default')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($addresses);
    }

    /**
     * Store a new address
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'label' => 'required|string|max:50',
            'full_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address_line1' => 'required|string|max:500',
            'address_line2' => 'nullable|string|max:500',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'pincode' => 'required|string|max:10',
            'country' => 'nullable|string|max:100',
            'is_default' => 'boolean',
        ]);

        // If this is set as default, unset other defaults
        if ($request->boolean('is_default')) {
            $request->user()->addresses()->update(['is_default' => false]);
        }

        // If this is the first address, make it default
        if ($request->user()->addresses()->count() === 0) {
            $validated['is_default'] = true;
        }

        $address = $request->user()->addresses()->create($validated);

        return response()->json([
            'message' => 'Address added successfully.',
            'address' => $address,
        ], 201);
    }

    /**
     * Get a specific address
     */
    public function show(Request $request, Address $address)
    {
        // Ensure the address belongs to the user
        if ($address->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Address not found.'], 404);
        }

        return response()->json($address);
    }

    /**
     * Update an address
     */
    public function update(Request $request, Address $address)
    {
        // Ensure the address belongs to the user
        if ($address->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Address not found.'], 404);
        }

        $validated = $request->validate([
            'label' => 'sometimes|string|max:50',
            'full_name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'address_line1' => 'sometimes|string|max:500',
            'address_line2' => 'nullable|string|max:500',
            'city' => 'sometimes|string|max:100',
            'state' => 'sometimes|string|max:100',
            'pincode' => 'sometimes|string|max:10',
            'country' => 'nullable|string|max:100',
            'is_default' => 'boolean',
        ]);

        // If setting as default, unset other defaults
        if ($request->boolean('is_default')) {
            $request->user()->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
        }

        $address->update($validated);

        return response()->json([
            'message' => 'Address updated successfully.',
            'address' => $address->fresh(),
        ]);
    }

    /**
     * Delete an address
     */
    public function destroy(Request $request, Address $address)
    {
        // Ensure the address belongs to the user
        if ($address->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Address not found.'], 404);
        }

        $wasDefault = $address->is_default;
        $address->delete();

        // If deleted address was default, make another one default
        if ($wasDefault) {
            $newDefault = $request->user()->addresses()->first();
            if ($newDefault) {
                $newDefault->update(['is_default' => true]);
            }
        }

        return response()->json(['message' => 'Address deleted successfully.']);
    }

    /**
     * Set an address as default
     */
    public function setDefault(Request $request, Address $address)
    {
        if ($address->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Address not found.'], 404);
        }

        $request->user()->addresses()->update(['is_default' => false]);
        $address->update(['is_default' => true]);

        return response()->json([
            'message' => 'Default address updated.',
            'address' => $address->fresh(),
        ]);
    }
}
