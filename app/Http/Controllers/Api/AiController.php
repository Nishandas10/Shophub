<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\AiService;
use Illuminate\Http\Request;

class AiController extends Controller
{
    protected AiService $aiService;

    public function __construct(AiService $aiService)
    {
        $this->aiService = $aiService;
    }

    public function generateDescription(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'features' => ['required', 'string', 'max:1000'],
        ]);

        $result = $this->aiService->generateProductDescription(
            $validated['name'],
            $validated['features']
        );

        return response()->json($result);
    }

    public function shoppingAssistant(Request $request)
    {
        $validated = $request->validate([
            'query' => ['required', 'string', 'max:500'],
        ]);

        $categories = Product::select('category')->distinct()->pluck('category')->toArray();

        $aiResult = $this->aiService->shoppingAssistant(
            $validated['query'],
            $categories
        );

        $productQuery = Product::query()->where('stock', '>', 0);
        $hasFilters = false;

        // Apply search filter
        if (!empty($aiResult['suggested_search'])) {
            $search = $aiResult['suggested_search'];
            $productQuery->where(function ($q) use ($search) {
                $searchTerms = explode(' ', $search);
                foreach ($searchTerms as $term) {
                    if (strlen($term) > 2) {
                        $q->orWhere('name', 'like', "%{$term}%")
                          ->orWhere('description', 'like', "%{$term}%")
                          ->orWhere('category', 'like', "%{$term}%");
                    }
                }
            });
            $hasFilters = true;
        }

        // Apply category filter
        if (!empty($aiResult['suggested_category'])) {
            $productQuery->where('category', $aiResult['suggested_category']);
            $hasFilters = true;
        }

        // Apply price range filter
        if (!empty($aiResult['price_range'])) {
            if (isset($aiResult['price_range']['min'])) {
                $productQuery->where('price', '>=', $aiResult['price_range']['min']);
            }
            if (isset($aiResult['price_range']['max'])) {
                $productQuery->where('price', '<=', $aiResult['price_range']['max']);
            }
            $hasFilters = true;
        }

        // Get products
        $products = $productQuery->take(12)->get();

        // If no products found with filters, try broader search or get random
        if ($products->isEmpty() && $hasFilters) {
            // Try just category
            if (!empty($aiResult['suggested_category'])) {
                $products = Product::where('stock', '>', 0)
                    ->where('category', $aiResult['suggested_category'])
                    ->take(12)
                    ->get();
            }

            // Still empty? Get random products
            if ($products->isEmpty()) {
                $products = Product::where('stock', '>', 0)
                    ->inRandomOrder()
                    ->take(12)
                    ->get();
                $aiResult['response'] = "I couldn't find exact matches, but here are some popular products you might like!";
            }
        }

        // If no filters were applied, get random/featured products
        if (!$hasFilters) {
            $products = Product::where('stock', '>', 0)
                ->inRandomOrder()
                ->take(12)
                ->get();
        }

        return response()->json([
            'message' => $aiResult['response'] ?? 'Here are some suggestions.',
            'products' => $products,
            'filters_applied' => [
                'search' => $aiResult['suggested_search'] ?? null,
                'category' => $aiResult['suggested_category'] ?? null,
                'price_range' => $aiResult['price_range'] ?? null,
            ],
        ]);
    }
}
