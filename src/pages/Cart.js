import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartPage() {
    const { items, total, loading, fetchCart, updateQuantity, removeItem, clearCart } = useCart();
    const [updating, setUpdating] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const handleUpdateQuantity = async (cartId, qty) => {
        setUpdating(cartId);
        try {
            await updateQuantity(cartId, qty);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update');
        } finally {
            setUpdating(null);
        }
    };

    const handleRemove = async (cartId) => {
        setUpdating(cartId);
        try {
            await removeItem(cartId);
        } catch (err) {
            alert('Failed to remove item');
        } finally {
            setUpdating(null);
        }
    };

    const getProductImage = (product) => {
        if (product.image) {
            if (product.image.startsWith('http')) {
                return product.image;
            }
            return `http://localhost:8000/storage/${product.image}`;
        }
        return `https://picsum.photos/seed/${encodeURIComponent(product.category || 'product')}/100/100`;
    };

    if (loading) return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} />
        </div>
    );

    return (
        <div className="bg-light min-vh-100">
            <div className="container py-4">
                <h2 className="fw-bold mb-4">🛒 Shopping Cart</h2>

                {items.length === 0 ? (
                    <div className="card border-0 shadow-sm">
                        <div className="card-body text-center py-5">
                            <div className="fs-1 mb-3">🛒</div>
                            <h4 className="text-muted mb-3">Your cart is empty</h4>
                            <p className="text-muted mb-4">Looks like you haven't added any items yet.</p>
                            <Link to="/products" className="btn btn-primary btn-lg">
                                Start Shopping
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="row g-4">
                        {/* Cart Items */}
                        <div className="col-lg-8">
                            <div className="card border-0 shadow-sm">
                                <div className="card-header bg-white py-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0">Cart Items ({items.length})</h5>
                                        <button className="btn btn-link text-danger p-0" onClick={clearCart}>
                                            Clear All
                                        </button>
                                    </div>
                                </div>
                                <div className="card-body p-0">
                                    {items.map((item, index) => (
                                        <div key={item.id} className={`p-4 ${index !== items.length - 1 ? 'border-bottom' : ''}`}>
                                            <div className="row align-items-center">
                                                <div className="col-auto">
                                                    <img
                                                        src={getProductImage(item.product)}
                                                        alt={item.product.name}
                                                        className="rounded"
                                                        style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                                    />
                                                </div>
                                                <div className="col">
                                                    <Link to={`/products/${item.product.id}`} className="text-decoration-none">
                                                        <h6 className="mb-1 text-dark fw-semibold">{item.product.name}</h6>
                                                    </Link>
                                                    <span className="badge bg-light text-dark small">{item.product.category}</span>
                                                    <p className="text-primary fw-bold mb-0 mt-2">₹{item.product.price}</p>
                                                </div>
                                                <div className="col-auto">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <button
                                                            className="btn btn-outline-secondary btn-sm"
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                            disabled={item.quantity <= 1 || updating === item.id}
                                                        >−</button>
                                                        <span className="fw-bold px-2" style={{ minWidth: '30px', textAlign: 'center' }}>
                                                            {updating === item.id ? (
                                                                <span className="spinner-border spinner-border-sm" />
                                                            ) : item.quantity}
                                                        </span>
                                                        <button
                                                            className="btn btn-outline-secondary btn-sm"
                                                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                            disabled={updating === item.id}
                                                        >+</button>
                                                    </div>
                                                </div>
                                                <div className="col-auto text-end" style={{ minWidth: '100px' }}>
                                                    <p className="fw-bold mb-1">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                                                    <button
                                                        className="btn btn-link text-danger p-0 small"
                                                        onClick={() => handleRemove(item.id)}
                                                        disabled={updating === item.id}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="col-lg-4">
                            <div className="card border-0 shadow-sm sticky-top" style={{ top: '100px' }}>
                                <div className="card-header bg-white py-3">
                                    <h5 className="mb-0">Order Summary</h5>
                                </div>
                                <div className="card-body">
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">Subtotal ({items.length} items)</span>
                                        <span>₹{total}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">Shipping</span>
                                        <span className="text-success">Free</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">Tax</span>
                                        <span>₹{(parseFloat(total) * 0.1).toFixed(2)}</span>
                                    </div>
                                    <hr />
                                    <div className="d-flex justify-content-between mb-4">
                                        <span className="h5 mb-0">Total</span>
                                        <span className="h5 text-primary mb-0">₹{(parseFloat(total) * 1.1).toFixed(2)}</span>
                                    </div>
                                    <div className="d-grid gap-2">
                                        <button
                                            className="btn btn-primary btn-lg"
                                            onClick={() => navigate('/checkout')}
                                        >
                                            Proceed to Checkout
                                        </button>
                                        <Link to="/products" className="btn btn-outline-secondary">
                                            Continue Shopping
                                        </Link>
                                    </div>
                                </div>
                                <div className="card-footer bg-light border-0">
                                    <div className="d-flex align-items-center justify-content-center gap-3 small text-muted">
                                        <span>🔒 Secure</span>
                                        <span>🚚 Free Shipping</span>
                                        <span>↩️ Easy Returns</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
