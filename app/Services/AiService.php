<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiService
{
    protected string $apiKey;
    protected string $model;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.key', '');
        $this->model = config('services.gemini.model', 'gemini-1.5-flash');
    }

    public function generateProductDescription(string $name, string $features): array
    {
        $prompt = "You are a professional e-commerce copywriter. Generate a compelling product description and SEO keywords for the following product.\n\n"
            . "Product Name: {$name}\n"
            . "Features: {$features}\n\n"
            . "Respond in JSON format with these fields:\n"
            . "- description: A marketing-friendly product description (2-3 paragraphs)\n"
            . "- seo_keywords: An array of 5-10 relevant SEO keywords\n\n"
            . "Return ONLY valid JSON, no markdown.";

        return $this->callApi($prompt, 'description', ['name' => $name, 'features' => $features]);
    }

    public function shoppingAssistant(string $query, array $availableCategories = []): array
    {
        $categoryList = implode(', ', $availableCategories);

        $prompt = "You are a helpful shopping assistant for an e-commerce store. "
            . "Available product categories: {$categoryList}\n\n"
            . "Customer query: {$query}\n\n"
            . "Respond in JSON format with these fields:\n"
            . "- suggested_search: A search term to find matching products\n"
            . "- suggested_category: The most relevant category (or null)\n"
            . "- response: A friendly, helpful response to the customer (1-2 sentences)\n"
            . "- price_range: An object with min and max if the customer mentions budget (or null)\n\n"
            . "Return ONLY valid JSON, no markdown.";

        return $this->callApi($prompt, 'assistant', ['query' => $query, 'categories' => $availableCategories]);
    }

    protected function callApi(string $prompt, string $type = '', array $context = []): array
    {
        if (empty($this->apiKey)) {
            return $this->mockResponse($type, $context);
        }

        try {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}";

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->timeout(30)->post($url, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.7,
                    'maxOutputTokens' => 1000,
                ],
            ]);

            if ($response->successful()) {
                $content = $response->json('candidates.0.content.parts.0.text', '{}');
                // Clean markdown code blocks if present
                $content = preg_replace('/```json\s*/', '', $content);
                $content = preg_replace('/```\s*/', '', $content);
                $decoded = json_decode(trim($content), true);
                return $decoded ?: ['raw_response' => $content];
            }

            Log::error('AI API error', ['status' => $response->status(), 'body' => $response->body()]);
            return $this->mockResponse($type, $context);
        } catch (\Exception $e) {
            Log::error('AI API exception', ['message' => $e->getMessage()]);
            return $this->mockResponse($type, $context);
        }
    }

    protected function mockResponse(string $type, array $context = []): array
    {
        if ($type === 'description') {
            $name = $context['name'] ?? 'Product';
            $features = $context['features'] ?? '';

            return [
                'description' => "Introducing the {$name} - a premium quality product designed to exceed your expectations. {$features} Crafted with meticulous attention to detail, this product combines cutting-edge functionality with elegant style. Whether you're a professional or enthusiast, you'll appreciate its exceptional performance and reliability. Experience the difference that quality makes with this outstanding addition to your collection.",
                'seo_keywords' => ['premium', 'quality', 'professional', 'reliable', 'best seller', 'top rated', strtolower($name)],
            ];
        }

        // Shopping assistant - parse the query intelligently
        $query = strtolower($context['query'] ?? '');
        $categories = $context['categories'] ?? [];

        // Extract price range from query
        $priceRange = null;
        if (preg_match('/under\s*\$?(\d+)/i', $query, $matches)) {
            $priceRange = ['min' => 0, 'max' => (int)$matches[1]];
        } elseif (preg_match('/\$?(\d+)\s*-\s*\$?(\d+)/i', $query, $matches)) {
            $priceRange = ['min' => (int)$matches[1], 'max' => (int)$matches[2]];
        } elseif (preg_match('/budget|cheap|affordable|inexpensive/i', $query)) {
            $priceRange = ['min' => 0, 'max' => 2000];
        }

        // Detect category from query
        $suggestedCategory = null;
        $categoryKeywords = [
            'Electronics' => ['electronic', 'tech', 'gadget', 'phone', 'computer', 'laptop', 'headphone', 'speaker', 'keyboard', 'mouse', 'gaming', 'usb', 'charger', 'power bank', 'webcam', 'watch'],
            'Clothing' => ['cloth', 'shirt', 'pant', 'jean', 'jacket', 'shoe', 'sneaker', 'hoodie', 'dress', 'wear', 'fashion', 'outfit', 'belt', 'apparel'],
            'Home & Kitchen' => ['home', 'kitchen', 'cook', 'pan', 'pot', 'blender', 'coffee', 'mug', 'bottle', 'cutting', 'scale', 'air fryer', 'toaster', 'appliance'],
            'Books' => ['book', 'read', 'novel', 'guide', 'learn', 'programming', 'cookbook', 'fiction', 'study', 'education'],
            'Sports' => ['sport', 'fitness', 'gym', 'yoga', 'exercise', 'workout', 'dumbbell', 'resistance', 'running', 'tennis', 'athletic', 'training'],
        ];

        foreach ($categoryKeywords as $category => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($query, $keyword)) {
                    if (in_array($category, $categories)) {
                        $suggestedCategory = $category;
                        break 2;
                    }
                }
            }
        }

        // Extract search terms - remove common words
        $stopWords = ['i', 'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'want', 'looking', 'for', 'find', 'show', 'me', 'some', 'any', 'get', 'buy', 'purchase', 'search', 'help', 'please', 'thanks', 'thank', 'you', 'your', 'my', 'of', 'to', 'in', 'on', 'at', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'im', "i'm", 'something', 'anything', 'gift', 'item', 'items', 'product', 'products', 'good', 'best', 'great', 'nice'];

        $words = preg_split('/\s+/', preg_replace('/[^\w\s]/', '', $query));
        $searchTerms = array_filter($words, function($word) use ($stopWords) {
            return strlen($word) > 2 && !in_array($word, $stopWords) && !is_numeric($word);
        });

        $suggestedSearch = implode(' ', array_slice(array_values($searchTerms), 0, 3));

        // If no specific search terms found, use category or generic
        if (empty($suggestedSearch)) {
            $suggestedSearch = $suggestedCategory ? strtolower($suggestedCategory) : '';
        }

        // Build friendly response
        $response = "I found some products that might interest you!";
        if ($suggestedCategory) {
            $response = "Great choice! Here are some {$suggestedCategory} products for you.";
        }
        if ($priceRange) {
            $response .= " I've filtered for items within your budget.";
        }
        if (empty($suggestedSearch) && !$suggestedCategory) {
            $response = "Here are some popular products you might like!";
            $suggestedSearch = ''; // Will return all products
        }

        return [
            'suggested_search' => $suggestedSearch,
            'suggested_category' => $suggestedCategory,
            'response' => $response,
            'price_range' => $priceRange,
        ];
    }
}
