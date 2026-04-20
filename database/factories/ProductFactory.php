<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    protected array $productTemplates = [
        'Electronics' => [
            ['name' => 'Wireless Bluetooth Headphones', 'desc' => 'Premium wireless headphones with active noise cancellation, 30-hour battery life, and crystal-clear sound. Perfect for music lovers and professionals.', 'img' => 'https://picsum.photos/seed/headphones/400/300', 'price' => 2499],
            ['name' => 'Smart Watch Pro', 'desc' => 'Advanced smartwatch with health monitoring, GPS tracking, and 7-day battery. Stay connected with notifications and fitness tracking.', 'img' => 'https://picsum.photos/seed/smartwatch/400/300', 'price' => 8999],
        ],
        'Clothing' => [
            ['name' => 'Classic Cotton T-Shirt', 'desc' => 'Premium 100% cotton t-shirt with a comfortable fit. Breathable fabric perfect for everyday wear. Available in multiple colors.', 'img' => 'https://picsum.photos/seed/tshirt/400/300', 'price' => 599],
            ['name' => 'Slim Fit Jeans', 'desc' => 'Modern slim fit jeans made from stretch denim for comfort and style. Classic 5-pocket design with premium hardware.', 'img' => 'https://picsum.photos/seed/jeans/400/300', 'price' => 1299],
        ],
        'Home & Kitchen' => [
            ['name' => 'Programmable Coffee Maker', 'desc' => '12-cup coffee maker with programmable timer, brew strength control, and keep-warm function.', 'img' => 'https://picsum.photos/seed/coffeemaker/400/300', 'price' => 3499],
            ['name' => 'Digital Air Fryer', 'desc' => 'Large capacity air fryer with digital controls and preset programs. Healthier cooking with less oil.', 'img' => 'https://picsum.photos/seed/kitchen/400/300', 'price' => 4999],
        ],
        'Books' => [
            ['name' => 'Python Programming Masterclass', 'desc' => 'Comprehensive guide to Python programming from basics to advanced concepts. Includes real-world projects and exercises.', 'img' => 'https://picsum.photos/seed/programming/400/300', 'price' => 499],
            ['name' => 'Culinary Masterclass Cookbook', 'desc' => 'Over 200 recipes from world-renowned chefs. Step-by-step instructions with beautiful photography.', 'img' => 'https://picsum.photos/seed/cookbook/400/300', 'price' => 799],
        ],
        'Sports' => [
            ['name' => 'Premium Yoga Mat', 'desc' => 'Extra thick eco-friendly yoga mat with non-slip surface. Perfect for yoga, pilates, and floor exercises.', 'img' => 'https://picsum.photos/seed/yoga/400/300', 'price' => 1499],
            ['name' => 'Adjustable Dumbbell Set', 'desc' => 'Space-saving adjustable dumbbells from 5 to 50 lbs. Quick-change weight system for efficient workouts.', 'img' => 'https://picsum.photos/seed/fitness/400/300', 'price' => 6999],
        ],
    ];

    protected static array $categoryCounters = [];

    public function definition(): array
    {
        $category = $this->faker->randomElement(array_keys($this->productTemplates));
        $templates = $this->productTemplates[$category];

        // Pick sequentially so each call within a category gets a different product
        $index = (self::$categoryCounters[$category] ?? 0) % count($templates);
        self::$categoryCounters[$category] = $index + 1;
        $product = $templates[$index];

        $imageUrl = $product['img'];

        return [
            'name' => $product['name'],
            'description' => $product['desc'],
            'price' => $product['price'],
            'category' => $category,
            'stock' => $this->faker->numberBetween(5, 50),
            'image' => $imageUrl,
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (Product $product) {
            // When category is forced via state, pick from correct template list
            $templates = $this->productTemplates[$product->category] ?? null;
            if ($templates) {
                $index = (self::$categoryCounters[$product->category] ?? 0) % count($templates);
                self::$categoryCounters[$product->category] = $index + 1;
                $template = $templates[$index];
                $product->name = $template['name'];
                $product->description = $template['desc'];
                $product->price = $template['price'];
                $product->image = $template['img'];
            }
        });
    }
}
