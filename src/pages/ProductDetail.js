import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function ProductDetail() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);
    const [message, setMessage] = useState('');
    const [relatedProducts, setRelatedProducts] = useState([]);
    const { user } = useAuth();
    const { addToCart } = useCart();
    const navigate = useNavigate();

    useEffect(() => {
        api.get(`/products/${id}`)
            .then(res => {
                setProduct(res.data);
                // Fetch related products from same category
                api.get('/products', { params: { category: res.data.category, per_page: 4 } })
                    .then(relRes => {
                        setRelatedProducts(relRes.data.data.filter(p => p.id !== res.data.id).slice(0, 4));
                    });
            })
            .catch(() => navigate('/products'))
            .finally(() => setLoading(false));
    }, [id, navigate]);

    const handleAddToCart = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        setAdding(true);
        setMessage('');
        try {
            await addToCart(product.id, quantity);
            setMessage('Added to cart!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to add to cart.');
        } finally {
            setAdding(false);
        }
    };

    const getProductImage = (prod) => {
        if (prod.image) {
            if (prod.image.startsWith('http')) {
                return prod.image;
            }
            return `http://localhost:8000/storage/${prod.image}`;
        }
        return `https://picsum.photos/seed/${encodeURIComponent(prod.category)}/600/400`;
    };

    if (loading) return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} />
        </div>
    );
    if (!product) return null;

    return (
        <div className="bg-light min-vh-100">
            <div className="container py-4">
                {/* Breadcrumb */}
                <nav aria-label="breadcrumb" className="mb-4">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                        <li className="breadcrumb-item"><Link to="/products">Products</Link></li>
                        <li className="breadcrumb-item"><Link to={`/products?category=${product.category}`}>{product.category}</Link></li>
                        <li className="breadcrumb-item active">{product.name}</li>
                    </ol>
                </nav>

                {/* Product Details Card */}
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body p-4">
                        <div className="row">
                            {/* Product Image */}
                            <div className="col-lg-6 mb-4 mb-lg-0">
                                <div className="position-relative">
                                    <img
                                        src={getProductImage(product)}
                                        className="img-fluid rounded-3 w-100"
                                        alt={product.name}
                                        style={{ maxHeight: '500px', objectFit: 'cover' }}
                                    />
                                    {product.stock < 10 && product.stock > 0 && (
                                        <span className="badge bg-warning text-dark position-absolute top-0 start-0 m-3 fs-6">
                                            Only {product.stock} left!
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="col-lg-6">
                                <div className="d-flex align-items-center gap-2 mb-3">
                                    <span className="badge bg-primary">{product.category}</span>
                                    <span className="text-warning">★★★★★</span>
                                    <span className="text-muted small">(128 reviews)</span>
                                </div>

                                <h1 className="h2 fw-bold mb-3">{product.name}</h1>

                                <div className="d-flex align-items-baseline gap-2 mb-4">
                                    <span className="h2 text-primary fw-bold mb-0">₹{product.price}</span>
                                    <span className="text-muted text-decoration-line-through small">₹{(product.price * 1.2).toFixed(2)}</span>
                                    <span className="badge bg-success">20% OFF</span>
                                </div>

                                {/* Stock Status */}
                                <div className="mb-4">
                                    {product.stock > 10 ? (
                                        <div className="d-flex align-items-center text-success">
                                            <span className="me-2">✓</span>
                                            <span className="fw-semibold">In Stock</span>
                                            <span className="text-muted ms-2">({product.stock} available)</span>
                                        </div>
                                    ) : product.stock > 0 ? (
                                        <div className="d-flex align-items-center text-warning">
                                            <span className="me-2">⚠</span>
                                            <span className="fw-semibold">Low Stock</span>
                                            <span className="text-muted ms-2">(Only {product.stock} left)</span>
                                        </div>
                                    ) : (
                                        <div className="d-flex align-items-center text-danger">
                                            <span className="me-2">✗</span>
                                            <span className="fw-semibold">Out of Stock</span>
                                        </div>
                                    )}
                                </div>

                                <hr />

                                {/* Description */}
                                <div className="mb-4">
                                    <h6 className="fw-semibold mb-2">Description</h6>
                                    <p className="text-muted">{product.description}</p>
                                </div>

                                <hr />

                                {/* Add to Cart */}
                                {product.stock > 0 && (
                                    <div className="mb-4">
                                        <div className="row g-3 align-items-center">
                                            <div className="col-auto">
                                                <label className="form-label mb-0 fw-semibold">Quantity</label>
                                            </div>
                                            <div className="col-auto">
                                                <div className="input-group" style={{ width: '140px' }}>
                                                    <button
                                                        className="btn btn-outline-secondary"
                                                        type="button"
                                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                    >
                                                        −
                                                    </button>
                                                    <input
                                                        type="number"
                                                        className="form-control text-center"
                                                        min="1"
                                                        max={product.stock}
                                                        value={quantity}
                                                        onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                                                    />
                                                    <button
                                                        className="btn btn-outline-secondary"
                                                        type="button"
                                                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-grid gap-2 mt-4">
                                            <button
                                                className="btn btn-primary btn-lg"
                                                onClick={handleAddToCart}
                                                disabled={adding}
                                            >
                                                {adding ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" />
                                                        Adding...
                                                    </>
                                                ) : (
                                                    <>🛒 Add to Cart</>
                                                )}
                                            </button>
                                            <button className="btn btn-outline-dark btn-lg">
                                                ♡ Add to Wishlist
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {message && (
                                    <div className={`alert ${message.includes('Added') ? 'alert-success' : 'alert-danger'} d-flex align-items-center`}>
                                        <span className="me-2">{message.includes('Added') ? '✓' : '✗'}</span>
                                        {message}
                                    </div>
                                )}

                                {/* Trust badges */}
                                <div className="d-flex gap-4 mt-4 pt-4 border-top">
                                    <div className="text-center">
                                        <div className="text-primary mb-1">🚚</div>
                                        <small className="text-muted">Free Shipping</small>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-primary mb-1">↩️</div>
                                        <small className="text-muted">30-Day Returns</small>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-primary mb-1">🔒</div>
                                        <small className="text-muted">Secure Checkout</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="mt-5">
                        <h4 className="fw-bold mb-4">You May Also Like</h4>
                        <div className="row g-4">
                            {relatedProducts.map(p => (
                                <div key={p.id} className="col-6 col-md-3">
                                    <Link to={`/products/${p.id}`} className="text-decoration-none">
                                        <div className="card border-0 shadow-sm h-100 product-card">
                                            <img
                                                src={getProductImage(p)}
                                                className="card-img-top"
                                                alt={p.name}
                                                style={{ height: '160px', objectFit: 'cover' }}
                                            />
                                            <div className="card-body">
                                                <h6 className="text-dark mb-1" style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>{p.name}</h6>
                                                <span className="text-primary fw-bold">₹{p.price}</span>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
