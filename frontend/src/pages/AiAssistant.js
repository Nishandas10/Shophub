import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';

export default function AiAssistant() {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [addingToCart, setAddingToCart] = useState(null);
    const { addToCart } = useCart();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError('');
        setResult(null);
        try {
            const res = await api.post('/ai/assistant', { query });
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to get AI response.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async (productId) => {
        setAddingToCart(productId);
        try {
            await addToCart(productId, 1);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add to cart');
        } finally {
            setAddingToCart(null);
        }
    };

    const getProductImage = (product) => {
        if (product.image) {
            if (product.image.startsWith('http')) {
                return product.image;
            }
            return `http://localhost:8000/storage/${product.image}`;
        }
        return `https://picsum.photos/seed/${encodeURIComponent(product.category || 'product')}/400/300`;
    };

    const exampleQueries = [
        "I need headphones under ₹5000",
        "Show me sports equipment for fitness",
        "Looking for affordable clothing",
        "What books do you have?",
        "I need kitchen appliances",
        "Gift ideas under ₹2000"
    ];

    return (
        <div className="bg-light min-vh-100">
            <div className="container py-4">
                {/* Header */}
                <div className="text-center mb-4">
                    <h2 className="fw-bold">🤖 AI Shopping Assistant</h2>
                    <p className="text-muted">Tell me what you're looking for and I'll help you find the perfect products!</p>
                </div>

                {/* Search Form */}
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body p-4">
                        <form onSubmit={handleSubmit}>
                            <div className="input-group input-group-lg">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g., 'I need headphones under ₹5000' or 'Show me electronics for gaming'"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <button className="btn btn-primary px-4" type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Thinking...
                                        </>
                                    ) : (
                                        <>🔍 Ask AI</>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Quick Suggestions */}
                        <div className="mt-3">
                            <small className="text-muted">Try: </small>
                            {exampleQueries.slice(0, 3).map((q, i) => (
                                <button
                                    key={i}
                                    className="btn btn-sm btn-outline-secondary me-2 mb-2"
                                    onClick={() => setQuery(q)}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-danger d-flex align-items-center">
                        <span className="me-2">⚠️</span>
                        {error}
                    </div>
                )}

                {result && (
                    <div>
                        {/* AI Response */}
                        <div className="card border-0 shadow-sm mb-4 bg-primary text-white">
                            <div className="card-body">
                                <div className="d-flex align-items-start">
                                    <div className="bg-white text-primary rounded-circle p-2 me-3" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        🤖
                                    </div>
                                    <div>
                                        <p className="mb-2 fs-5">{result.message}</p>
                                        {result.filters_applied && (
                                            <div className="d-flex flex-wrap gap-2">
                                                {result.filters_applied.category && (
                                                    <span className="badge bg-light text-dark">
                                                        Category: {result.filters_applied.category}
                                                    </span>
                                                )}
                                                {result.filters_applied.search && (
                                                    <span className="badge bg-light text-dark">
                                                        Search: {result.filters_applied.search}
                                                    </span>
                                                )}
                                                {result.filters_applied.price_range && (
                                                    <span className="badge bg-light text-dark">
                                                        Budget: ₹{result.filters_applied.price_range.min || 0} - ₹{result.filters_applied.price_range.max || '∞'}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Products Grid */}
                        {result.products && result.products.length > 0 ? (
                            <div className="row g-4">
                                {result.products.map(product => (
                                    <div key={product.id} className="col-6 col-md-4 col-lg-3">
                                        <div className="card border-0 shadow-sm h-100 product-card">
                                            <div className="position-relative">
                                                <img
                                                    src={getProductImage(product)}
                                                    className="card-img-top"
                                                    alt={product.name}
                                                    style={{ height: '180px', objectFit: 'cover' }}
                                                />
                                                {product.stock < 10 && product.stock > 0 && (
                                                    <span className="badge bg-warning text-dark position-absolute top-0 start-0 m-2">
                                                        Low Stock
                                                    </span>
                                                )}
                                            </div>
                                            <div className="card-body d-flex flex-column">
                                                <span className="badge bg-light text-dark mb-2 align-self-start small">
                                                    {product.category}
                                                </span>
                                                <h6 className="card-title mb-1" style={{
                                                    overflow: 'hidden',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical'
                                                }}>
                                                    {product.name}
                                                </h6>
                                                <p className="text-muted small mb-2" style={{
                                                    overflow: 'hidden',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical'
                                                }}>
                                                    {product.description}
                                                </p>
                                                <p className="h5 text-primary fw-bold mt-auto mb-3">
                                                    ₹{product.price}
                                                </p>
                                                <div className="d-grid gap-2">
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => handleAddToCart(product.id)}
                                                        disabled={addingToCart === product.id || product.stock === 0}
                                                    >
                                                        {addingToCart === product.id ? (
                                                            <span className="spinner-border spinner-border-sm" />
                                                        ) : product.stock === 0 ? (
                                                            'Out of Stock'
                                                        ) : (
                                                            '🛒 Add to Cart'
                                                        )}
                                                    </button>
                                                    <Link to={`/products/${product.id}`} className="btn btn-outline-secondary btn-sm">
                                                        View Details
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-5">
                                <div className="fs-1 mb-3">🔍</div>
                                <h5 className="text-muted">No products found</h5>
                                <p className="text-muted">Try a different search query</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Help Section - shown when no results */}
                {!result && !loading && (
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            <h5 className="fw-semibold mb-3">💡 How can I help you?</h5>
                            <p className="text-muted mb-4">
                                Just describe what you're looking for in natural language. I can understand:
                            </p>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <div className="bg-light rounded p-3">
                                        <strong>📦 Product Types</strong>
                                        <p className="small text-muted mb-0">"Show me headphones" or "I need running shoes"</p>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="bg-light rounded p-3">
                                        <strong>💰 Budget</strong>
                                        <p className="small text-muted mb-0">"Under ₹2000" or "Between ₹500-₹5000"</p>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="bg-light rounded p-3">
                                        <strong>🏷️ Categories</strong>
                                        <p className="small text-muted mb-0">"Electronics for gaming" or "Kitchen appliances"</p>
                                    </div>
                                </div>
                            </div>
                            <hr className="my-4" />
                            <h6 className="fw-semibold mb-3">Try these example queries:</h6>
                            <div className="d-flex flex-wrap gap-2">
                                {exampleQueries.map((q, i) => (
                                    <button
                                        key={i}
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={() => setQuery(q)}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
