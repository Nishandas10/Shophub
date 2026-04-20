You are a senior full-stack software architect and engineer.

I want you to design and help me build a production-level full-stack e-commerce web application.

The stack must be:

Backend:
- Laravel (latest stable version)
- MySQL database
- RESTful API architecture
- Laravel Sanctum for authentication

Frontend:
- React.js (latest)
- Axios for API calls
- Bootstrap for UI styling

Optional Enhancements:
- AI integration using LLM API (for product description generation and smart assistant features)

---

PROJECT GOAL:
Build a complete e-commerce platform with an admin panel and customer-facing storefront.

---

CORE FEATURES REQUIRED:

1. Authentication System
- User registration and login
- Role-based access (Admin, Customer)
- Protected routes using Sanctum

2. Product Management (Admin)
- Add, edit, delete products
- Product fields: name, description, price, category, stock, image
- Upload product images

3. Customer Product Browsing
- Product listing page
- Product detail page
- Search and filter products (by category, price)

4. Cart System
- Add to cart
- Update quantity
- Remove items
- Persistent cart (database-based preferred)

5. Order System
- Checkout process
- Order creation
- Order history for users
- Admin view of all orders
- Order status tracking (pending, shipped, completed)

6. Admin Dashboard
- Manage products
- Manage orders
- View basic analytics (optional simple counts)

---

AI FEATURES (IMPORTANT):
Include at least 1–2 meaningful AI integrations using an LLM API:

Option A:
- AI Product Description Generator (admin enters product name + features → AI generates marketing description + SEO keywords)

Option B:
- AI Shopping Assistant (user types natural language query → system suggests relevant products)

Option C:
- AI Review Summarizer (summarize product reviews into pros/cons)

Choose the best possible AI feature design and integrate it cleanly into the system.

---

ARCHITECTURE REQUIREMENTS:

- Separate backend and frontend clearly
- Backend must expose REST APIs only
- React frontend must consume APIs only
- Use proper MVC structure in Laravel
- Use service layer for AI API integration
- Use clean database schema with relationships

---

WHAT I WANT FROM YOU STEP-BY-STEP:

1. System architecture diagram (text explanation is fine)
2. Database schema (tables + relationships)
3. Laravel folder structure
4. API route definitions (complete list)
5. Backend implementation plan (step-by-step)
6. React frontend structure (pages + components)
7. Authentication flow (Laravel Sanctum + React)
8. Cart + Order flow design
9. AI integration design (prompt templates + API flow)
10. Development roadmap (week-wise build plan)

---

IMPORTANT RULES:
- Keep it practical and implementable (no vague theory)
- Prefer simple but correct architecture over over-engineering
- Assume I am a beginner to intermediate developer
- Do NOT skip database design or API structure
- Provide clear step-by-step build order
- Use real-world conventions used in production apps

Sample DB Structure
🔹 Users table
•	id 
•	name 
•	email 
•	password 
•	role (admin/customer) 
________________________________________
🔹 Products table
•	id 
•	name 
•	description 
•	price 
•	category 
•	stock 
•	image 
________________________________________
🔹 Orders table
•	id 
•	user_id 
•	total_price 
•	status (pending/shipped/completed) 
________________________________________
🔹 Order_items table
•	id 
•	order_id 
•	product_id 
•	quantity 
•	price 
________________________________________
🔹 Cart
•	user_id 
•	product_id 
•	quantity 
