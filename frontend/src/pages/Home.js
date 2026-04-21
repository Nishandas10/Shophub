import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../api/axios';

export default function Home() {
    const { user } = useAuth();
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState(null);

    useEffect(() => {
        Promise.all([
            api.get('/products', { params: { per_page: 8 } }),
            api.get('/products/categories')
        ]).then(([productsRes, categoriesRes]) => {
            setFeaturedProducts(productsRes.data.data);
            setCategories(categoriesRes.data);
        }).finally(() => setLoading(false));
    }, []);

    const handleAddToCart = async (productId) => {
        if (!user) {
            navigate('/login');
            return;
        }
        setAddingToCart(productId);
        try {
            await addToCart(productId, 1);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add to cart');
        } finally {
            setAddingToCart(null);
        }
    };

    const categoryIcons = {
        'Electronics': '💻',
        'Clothing': '👕',
        'Home & Kitchen': '🏠',
        'Books': '📚',
        'Sports': '⚽'
    };

    const getProductImage = (product) => {
        if (product.image) {
            if (product.image.startsWith('http')) {
                return product.image;
            }
            return `http://localhost:8000/storage/${product.image}`;
        }
        return `https://picsum.photos/seed/${encodeURIComponent(product.category)}/400/300`;
    };

    return (
        <div>
            {/* Hero Section */}
            <section style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                <div className="container">
                    <div className="text-center py-5" style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '80px', paddingBottom: '80px' }}>
                        <p className="text-uppercase fw-semibold mb-3" style={{ letterSpacing: '0.15em', fontSize: '0.75rem', color: '#999' }}>
                            New Arrivals
                        </p>
                        <h1 className="fw-bold mb-4 lh-1" style={{ fontSize: 'clamp(2.6rem, 6vw, 4rem)', color: '#111' }}>
                            Find what<br />you love.
                        </h1>
                        <p className="mb-5 mx-auto" style={{ color: '#666', fontSize: '1.05rem', lineHeight: '1.7', maxWidth: '420px' }}>
                            Quality products across electronics, clothing, home &amp; more — delivered to your door.
                        </p>
                        <div className="d-flex gap-3 justify-content-center align-items-center flex-wrap">
                            <Link to="/products"
                                className="btn px-5 py-2 fw-semibold"
                                style={{ background: '#111', color: '#fff', borderRadius: '4px', fontSize: '0.95rem' }}>
                                Shop Now
                            </Link>
                            {!user && (
                                <Link to="/register"
                                    className="text-decoration-none fw-semibold"
                                    style={{ color: '#555', fontSize: '0.95rem' }}>
                                    Create account →
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-5 bg-light">
                <div className="container">
                    <div className="row g-4">
                        <div className="col-md-3 col-6">
                            <div className="text-center">
                                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px' }}>
                                    <span className="fs-4">🚚</span>
                                </div>
                                <h6 className="fw-semibold">Free Shipping</h6>
                                <small className="text-muted">On orders over ₹100</small>
                            </div>
                        </div>
                        <div className="col-md-3 col-6">
                            <div className="text-center">
                                <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px' }}>
                                    <span className="fs-4">🔒</span>
                                </div>
                                <h6 className="fw-semibold">Secure Payment</h6>
                                <small className="text-muted">100% secure checkout</small>
                            </div>
                        </div>
                        <div className="col-md-3 col-6">
                            <div className="text-center">
                                <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px' }}>
                                    <span className="fs-4">↩️</span>
                                </div>
                                <h6 className="fw-semibold">Easy Returns</h6>
                                <small className="text-muted">30-day return policy</small>
                            </div>
                        </div>
                        <div className="col-md-3 col-6">
                            <div className="text-center">
                                <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px' }}>
                                    <span className="fs-4">💬</span>
                                </div>
                                <h6 className="fw-semibold">24/7 Support</h6>
                                <small className="text-muted">Dedicated support</small>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="py-5">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="fw-bold">Shop by Category</h2>
                        <p className="text-muted">Browse our wide range of categories</p>
                    </div>
                    <div className="row g-4">
                        {categories.map(cat => (
                            <div key={cat} className="col-6 col-md-4 col-lg">
                                <Link
                                    to={`/products?category=${encodeURIComponent(cat)}`}
                                    className="text-decoration-none"
                                >
                                    <div className="card border-0 shadow-sm h-100 category-card" style={{ transition: 'transform 0.2s' }}>
                                        <div className="card-body text-center py-4">
                                            <div className="fs-1 mb-2">{categoryIcons[cat] || '📦'}</div>
                                            <h6 className="fw-semibold text-dark mb-0">{cat}</h6>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products Section */}
            <section className="py-5 bg-light">
                <div className="container">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h2 className="fw-bold mb-1">Featured Products</h2>
                            <p className="text-muted mb-0">Handpicked products just for you</p>
                        </div>
                        <Link to="/products" className="btn btn-outline-primary">
                            View All →
                        </Link>
                    </div>

                    {loading ? (
                        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
                    ) : (
                        <div className="row g-4">
                            {featuredProducts.map(product => (
                                <div key={product.id} className="col-6 col-md-4 col-lg-3">
                                    <div className="card border-0 shadow-sm h-100 product-card">
                                        <div className="position-relative overflow-hidden">
                                            <img
                                                src={getProductImage(product)}
                                                className="card-img-top"
                                                alt={product.name}
                                                style={{ height: '200px', objectFit: 'cover' }}
                                            />
                                            {product.stock < 10 && product.stock > 0 && (
                                                <span className="badge bg-warning position-absolute top-0 start-0 m-2">Low Stock</span>
                                            )}
                                            {product.stock === 0 && (
                                                <span className="badge bg-danger position-absolute top-0 start-0 m-2">Out of Stock</span>
                                            )}
                                        </div>
                                        <div className="card-body d-flex flex-column">
                                            <span className="badge bg-light text-dark mb-2 align-self-start small">{product.category}</span>
                                            <h6 className="card-title mb-1" style={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>{product.name}</h6>
                                            <div className="d-flex align-items-center mb-2">
                                                <span className="text-warning me-1">★★★★★</span>
                                                <small className="text-muted">(4.5)</small>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center mt-auto">
                                                <span className="h5 text-primary mb-0 fw-bold">₹{product.price}</span>
                                            </div>
                                            <div className="d-flex gap-2 mt-3">
                                                <Link to={`/products/${product.id}`} className="btn btn-outline-secondary btn-sm flex-grow-1">
                                                    Details
                                                </Link>
                                                <button
                                                    className="btn btn-primary btn-sm flex-grow-1"
                                                    onClick={() => handleAddToCart(product.id)}
                                                    disabled={addingToCart === product.id || product.stock === 0}
                                                >
                                                    {addingToCart === product.id ? '...' : '+ Cart'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* AI Assistant Promo */}
            {user && user.role !== 'admin' && (
                <section className="py-5" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
                    <div className="container">
                        <div className="row align-items-center">
                            <div className="col-lg-6">
                                <h2 className="fw-bold mb-3">🤖 AI Shopping Assistant</h2>
                                <p className="text-muted mb-4">
                                    Not sure what you're looking for? Our AI-powered assistant can help you find
                                    the perfect products based on your needs. Just describe what you want!
                                </p>
                                <Link to="/ai-assistant" className="btn btn-dark btn-lg">
                                    Try AI Assistant
                                </Link>
                            </div>
                            <div className="col-lg-6 d-none d-lg-block">
                                <div className="card border-0 shadow">
                                    <div className="card-body">
                                        <div className="d-flex align-items-start mb-3">
                                            <div className="bg-primary text-white rounded-circle p-2 me-2">🤖</div>
                                            <div className="bg-light rounded p-3">
                                                <small>How can I help you today?</small>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-start justify-content-end">
                                            <div className="bg-primary text-white rounded p-3 me-2">
                                                <small>I need a gift under ₹5000</small>
                                            </div>
                                            <div className="bg-secondary text-white rounded-circle p-2">👤</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="bg-dark text-white pt-5 pb-3">
                <div className="container">
                    <div className="row g-4 mb-4">
                        <div className="col-md-4">
                            <div className="d-flex align-items-center mb-3">
                                <span className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                                      style={{ width: '36px', height: '36px', fontSize: '18px' }}>
                                    🛍️
                                </span>
                                <span className="fw-bold fs-5">ShopHub</span>
                            </div>
                            <p className="text-white-50 small">
                                Your one-stop shop for quality products across electronics, clothing, home, books, and sports.
                            </p>
                        </div>
                        <div className="col-md-2 offset-md-1">
                            <h6 className="fw-semibold mb-3">Shop</h6>
                            <ul className="list-unstyled">
                                <li className="mb-2"><Link to="/products" className="text-white-50 text-decoration-none small">All Products</Link></li>
                                <li className="mb-2"><Link to="/products?category=Electronics" className="text-white-50 text-decoration-none small">Electronics</Link></li>
                                <li className="mb-2"><Link to="/products?category=Clothing" className="text-white-50 text-decoration-none small">Clothing</Link></li>
                                <li className="mb-2"><Link to="/products?category=Sports" className="text-white-50 text-decoration-none small">Sports</Link></li>
                            </ul>
                        </div>
                        <div className="col-md-2">
                            <h6 className="fw-semibold mb-3">Account</h6>
                            <ul className="list-unstyled">
                                <li className="mb-2"><Link to="/login" className="text-white-50 text-decoration-none small">Sign In</Link></li>
                                <li className="mb-2"><Link to="/register" className="text-white-50 text-decoration-none small">Register</Link></li>
                                <li className="mb-2"><Link to="/orders" className="text-white-50 text-decoration-none small">My Orders</Link></li>
                                <li className="mb-2"><Link to="/cart" className="text-white-50 text-decoration-none small">Cart</Link></li>
                            </ul>
                        </div>
                        <div className="col-md-3">
                            <h6 className="fw-semibold mb-3">Support</h6>
                            <ul className="list-unstyled">
                                <li className="mb-2 text-white-50 small">🚚 Free shipping over ₹500</li>
                                <li className="mb-2 text-white-50 small">↩️ 30-day return policy</li>
                                <li className="mb-2 text-white-50 small">🔒 Secure checkout</li>
                                <li className="mb-2 text-white-50 small">💬 24/7 customer support</li>
                            </ul>
                        </div>
                    </div>
                    <hr className="border-secondary" />
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                        <small className="text-white-50">© 2026 ShopHub. All rights reserved.</small>
                        <small className="text-white-50 mt-2 mt-md-0">Built with ❤️ for great shopping experiences.</small>
                    </div>
                </div>
            </footer>
        </div>
    );
}
