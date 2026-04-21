import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Checkout() {
    const { items, total, fetchCart } = useCart();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Address state
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [addressForm, setAddressForm] = useState({
        label: 'Home',
        full_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        is_default: false,
    });
    const [addressErrors, setAddressErrors] = useState({});
    const [savingAddress, setSavingAddress] = useState(false);

    const fetchAddresses = useCallback(async () => {
        try {
            const res = await api.get('/addresses');
            setAddresses(res.data);
            // Select default address automatically
            const defaultAddr = res.data.find(a => a.is_default);
            if (defaultAddr) {
                setSelectedAddressId(defaultAddr.id);
            } else if (res.data.length > 0) {
                setSelectedAddressId(res.data[0].id);
            }
        } catch (e) {
            console.error('Failed to fetch addresses', e);
        } finally {
            setLoadingAddresses(false);
        }
    }, []);

    useEffect(() => {
        fetchCart();
        fetchAddresses();
    }, [fetchCart, fetchAddresses]);

    const resetAddressForm = () => {
        setAddressForm({
            label: 'Home',
            full_name: user?.name || '',
            phone: '',
            address_line1: '',
            address_line2: '',
            city: '',
            state: '',
            pincode: '',
            is_default: addresses.length === 0,
        });
        setAddressErrors({});
    };

    const handleAddAddressClick = () => {
        resetAddressForm();
        setShowAddressForm(true);
    };

    const handleAddressSubmit = async (e) => {
        e.preventDefault();
        setSavingAddress(true);
        setAddressErrors({});

        try {
            const res = await api.post('/addresses', addressForm);
            setShowAddressForm(false);
            await fetchAddresses();
            setSelectedAddressId(res.data.address.id);
        } catch (err) {
            if (err.response?.status === 422) {
                setAddressErrors(err.response.data.errors || {});
            } else {
                setAddressErrors({ general: err.response?.data?.message || 'Failed to save address.' });
            }
        } finally {
            setSavingAddress(false);
        }
    };

    const handlePayment = async () => {
        if (!selectedAddressId) {
            setError('Please select a delivery address.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Step 1: Create Razorpay order on backend
            const orderRes = await api.post('/payment/create-order');
            const { order_id, amount, currency, key_id } = orderRes.data;

            // Step 2: Open Razorpay checkout
            const selectedAddress = addresses.find(a => a.id === selectedAddressId);
            const options = {
                key: key_id,
                amount: amount,
                currency: currency,
                name: 'ShopHub',
                description: 'Purchase from ShopHub',
                order_id: order_id,
                handler: async function (response) {
                    // Step 3: Verify payment on backend
                    try {
                        const verifyRes = await api.post('/payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            address_id: selectedAddressId,
                        });

                        // Clear cart state in context
                        await fetchCart();

                        // Payment successful - redirect to order
                        navigate(`/orders/${verifyRes.data.order.id}`, {
                            state: { justPlaced: true, paymentSuccess: true }
                        });
                    } catch (err) {
                        setError(err.response?.data?.message || 'Payment verification failed.');
                        setLoading(false);
                    }
                },
                prefill: {
                    name: selectedAddress?.full_name || user?.name || '',
                    email: user?.email || '',
                    contact: selectedAddress?.phone || '',
                },
                theme: {
                    color: '#111111',
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                setError(`Payment failed: ${response.error.description}`);
                setLoading(false);
            });
            rzp.open();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initiate payment.');
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="container mt-5 text-center">
                <h5 className="text-muted">Your cart is empty. Nothing to checkout.</h5>
            </div>
        );
    }

    const selectedAddress = addresses.find(a => a.id === selectedAddressId);

    return (
        <div className="container mt-4">
            <h2 className="mb-4">Checkout</h2>
            <div className="row">
                <div className="col-lg-8">
                    {/* Delivery Address Section - Amazon/Flipkart style */}
                    <div className="card mb-4">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                <span className="badge bg-primary rounded-circle me-2">1</span>
                                Delivery Address
                            </h5>
                            {addresses.length > 0 && !showAddressForm && (
                                <button
                                    className="btn btn-link btn-sm"
                                    onClick={handleAddAddressClick}
                                >
                                    + Add New
                                </button>
                            )}
                        </div>
                        <div className="card-body">
                            {loadingAddresses ? (
                                <div className="text-center py-3">
                                    <div className="spinner-border spinner-border-sm" />
                                </div>
                            ) : showAddressForm ? (
                                /* Inline Address Form */
                                <div className="border rounded p-3 bg-light">
                                    <h6 className="mb-3">Add New Address</h6>
                                    {addressErrors.general && (
                                        <div className="alert alert-danger py-2">{addressErrors.general}</div>
                                    )}
                                    <form onSubmit={handleAddressSubmit}>
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label small">Address Type</label>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={addressForm.label}
                                                    onChange={e => setAddressForm(p => ({ ...p, label: e.target.value }))}
                                                >
                                                    <option value="Home">Home</option>
                                                    <option value="Work">Work</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label small">Full Name *</label>
                                                <input
                                                    type="text"
                                                    className={`form-control form-control-sm ${addressErrors.full_name ? 'is-invalid' : ''}`}
                                                    value={addressForm.full_name}
                                                    onChange={e => setAddressForm(p => ({ ...p, full_name: e.target.value }))}
                                                    required
                                                />
                                                {addressErrors.full_name && <div className="invalid-feedback">{addressErrors.full_name[0]}</div>}
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label small">Phone Number *</label>
                                            <input
                                                type="tel"
                                                className={`form-control form-control-sm ${addressErrors.phone ? 'is-invalid' : ''}`}
                                                value={addressForm.phone}
                                                onChange={e => setAddressForm(p => ({ ...p, phone: e.target.value }))}
                                                required
                                            />
                                            {addressErrors.phone && <div className="invalid-feedback">{addressErrors.phone[0]}</div>}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label small">Address Line 1 *</label>
                                            <input
                                                type="text"
                                                className={`form-control form-control-sm ${addressErrors.address_line1 ? 'is-invalid' : ''}`}
                                                value={addressForm.address_line1}
                                                onChange={e => setAddressForm(p => ({ ...p, address_line1: e.target.value }))}
                                                placeholder="House/Flat No., Building, Street"
                                                required
                                            />
                                            {addressErrors.address_line1 && <div className="invalid-feedback">{addressErrors.address_line1[0]}</div>}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label small">Address Line 2</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={addressForm.address_line2}
                                                onChange={e => setAddressForm(p => ({ ...p, address_line2: e.target.value }))}
                                                placeholder="Landmark, Area (optional)"
                                            />
                                        </div>
                                        <div className="row">
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label small">City *</label>
                                                <input
                                                    type="text"
                                                    className={`form-control form-control-sm ${addressErrors.city ? 'is-invalid' : ''}`}
                                                    value={addressForm.city}
                                                    onChange={e => setAddressForm(p => ({ ...p, city: e.target.value }))}
                                                    required
                                                />
                                                {addressErrors.city && <div className="invalid-feedback">{addressErrors.city[0]}</div>}
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label small">State *</label>
                                                <input
                                                    type="text"
                                                    className={`form-control form-control-sm ${addressErrors.state ? 'is-invalid' : ''}`}
                                                    value={addressForm.state}
                                                    onChange={e => setAddressForm(p => ({ ...p, state: e.target.value }))}
                                                    required
                                                />
                                                {addressErrors.state && <div className="invalid-feedback">{addressErrors.state[0]}</div>}
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label small">Pincode *</label>
                                                <input
                                                    type="text"
                                                    className={`form-control form-control-sm ${addressErrors.pincode ? 'is-invalid' : ''}`}
                                                    value={addressForm.pincode}
                                                    onChange={e => setAddressForm(p => ({ ...p, pincode: e.target.value }))}
                                                    maxLength="6"
                                                    required
                                                />
                                                {addressErrors.pincode && <div className="invalid-feedback">{addressErrors.pincode[0]}</div>}
                                            </div>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button type="submit" className="btn btn-primary btn-sm" disabled={savingAddress}>
                                                {savingAddress ? 'Saving...' : 'Save & Use This Address'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary btn-sm"
                                                onClick={() => setShowAddressForm(false)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            ) : addresses.length === 0 ? (
                                /* No addresses - prompt to add */
                                <div className="text-center py-4">
                                    <p className="text-muted mb-3">No delivery address found.</p>
                                    <button className="btn btn-primary" onClick={handleAddAddressClick}>
                                        + Add Delivery Address
                                    </button>
                                    <p className="small text-muted mt-2">
                                        Or <Link to="/profile">manage addresses</Link> in your profile
                                    </p>
                                </div>
                            ) : (
                                /* Address Selection - Amazon/Flipkart style */
                                <div className="row">
                                    {addresses.map(address => (
                                        <div key={address.id} className="col-12 mb-2">
                                            <div
                                                className={`border rounded p-3 cursor-pointer ${selectedAddressId === address.id ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => setSelectedAddressId(address.id)}
                                            >
                                                <div className="d-flex align-items-start">
                                                    <input
                                                        type="radio"
                                                        className="form-check-input mt-1 me-3"
                                                        checked={selectedAddressId === address.id}
                                                        onChange={() => setSelectedAddressId(address.id)}
                                                    />
                                                    <div className="flex-grow-1">
                                                        <div className="d-flex align-items-center mb-1">
                                                            <strong className="me-2">{address.full_name}</strong>
                                                            <span className="badge bg-secondary small">{address.label}</span>
                                                            {address.is_default && (
                                                                <span className="badge bg-success ms-2 small">Default</span>
                                                            )}
                                                        </div>
                                                        <p className="mb-1 small text-muted">
                                                            {address.address_line1}
                                                            {address.address_line2 && `, ${address.address_line2}`}
                                                        </p>
                                                        <p className="mb-1 small text-muted">
                                                            {address.city}, {address.state} - {address.pincode}
                                                        </p>
                                                        <p className="mb-0 small">📞 {address.phone}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Summary Section */}
                    <div className="card">
                        <div className="card-header bg-white">
                            <h5 className="mb-0">
                                <span className="badge bg-primary rounded-circle me-2">2</span>
                                Order Summary
                            </h5>
                        </div>
                        <div className="card-body p-0">
                            <table className="table mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Product</th>
                                        <th className="text-center">Qty</th>
                                        <th className="text-end">Price</th>
                                        <th className="text-end">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.product.name}</td>
                                            <td className="text-center">{item.quantity}</td>
                                            <td className="text-end">₹{item.product.price}</td>
                                            <td className="text-end">₹{(item.product.price * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Payment Section */}
                <div className="col-lg-4">
                    <div className="card sticky-top" style={{ top: '80px' }}>
                        <div className="card-header bg-white">
                            <h5 className="mb-0">
                                <span className="badge bg-primary rounded-circle me-2">3</span>
                                Payment
                            </h5>
                        </div>
                        <div className="card-body">
                            {/* Selected Address Preview */}
                            {selectedAddress && (
                                <div className="bg-light rounded p-3 mb-3">
                                    <small className="text-muted d-block mb-1">Delivering to:</small>
                                    <strong>{selectedAddress.full_name}</strong>
                                    <p className="small mb-0 text-muted">
                                        {selectedAddress.city}, {selectedAddress.pincode}
                                    </p>
                                </div>
                            )}

                            <div className="d-flex justify-content-between mb-2">
                                <span>Subtotal</span>
                                <span>₹{total}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Shipping</span>
                                <span className="text-success">Free</span>
                            </div>
                            <hr />
                            <div className="d-flex justify-content-between mb-3">
                                <strong>Total</strong>
                                <strong className="text-primary fs-5">₹{total}</strong>
                            </div>

                            {error && <div className="alert alert-danger py-2 small">{error}</div>}

                            {/* Razorpay test mode notice */}
                            <div className="alert alert-info py-2 small mb-3">
                                <strong>Test Mode:</strong> Use card 4100 2800 0000 1007, any future expiry, any CVV
                            </div>

                            <button
                                className="btn btn-success w-100 btn-lg d-flex align-items-center justify-content-center gap-2"
                                onClick={handlePayment}
                                disabled={loading || !selectedAddressId}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <span>💳</span> Pay ₹{total}
                                    </>
                                )}
                            </button>

                            {!selectedAddressId && addresses.length > 0 && (
                                <small className="text-danger d-block mt-2 text-center">
                                    Please select a delivery address
                                </small>
                            )}

                            <button
                                className="btn btn-outline-secondary w-100 mt-2"
                                onClick={() => navigate('/cart')}
                                disabled={loading}
                            >
                                Back to Cart
                            </button>

                            <div className="text-center mt-3">
                                <small className="text-muted">🔒 Secured by Razorpay</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
