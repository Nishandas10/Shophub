import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function AdminOrderDetail() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        api.get(`/orders/${id}`)
            .then(res => setOrder(res.data))
            .catch(() => navigate('/admin/orders'))
            .finally(() => setLoading(false));
    }, [id, navigate]);

    const statusBadge = (status) => {
        const colors = { pending: 'warning', shipped: 'info', completed: 'success' };
        return <span className={`badge bg-${colors[status] || 'secondary'} fs-6`}>{status}</span>;
    };

    const updateStatus = async (newStatus) => {
        setUpdating(true);
        try {
            const res = await api.put(`/admin/orders/${id}/status`, { status: newStatus });
            setOrder(res.data);
        } catch (err) {
            alert('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border" /></div>;
    if (!order) return null;

    return (
        <div className="container mt-4">
            <button className="btn btn-link mb-3" onClick={() => navigate('/admin/orders')}>
                ← Back to Orders
            </button>

            <div className="row">
                <div className="col-lg-8">
                    <div className="card mb-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="mb-0">Order #{order.id}</h4>
                            {statusBadge(order.status)}
                        </div>
                        <div className="card-body">
                            <div className="row mb-3">
                                <div className="col-md-4">
                                    <strong>Date:</strong>
                                    <p className="mb-0">{new Date(order.created_at).toLocaleString()}</p>
                                </div>
                                <div className="col-md-4">
                                    <strong>Total:</strong>
                                    <p className="mb-0 text-primary fw-bold fs-5">₹{order.total_price}</p>
                                </div>
                                <div className="col-md-4">
                                    <strong>Payment:</strong>
                                    <p className="mb-0">
                                        <span className={`badge ${order.payment_status === 'paid' ? 'bg-success' : 'bg-warning'}`}>
                                            {order.payment_status || 'N/A'}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <h5 className="mt-4">Order Items</h5>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Price</th>
                                        <th>Quantity</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items?.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.product?.name || 'Deleted Product'}</td>
                                            <td>₹{item.price}</td>
                                            <td>{item.quantity}</td>
                                            <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan="3" className="text-end fw-bold">Total:</td>
                                        <td className="fw-bold text-primary">₹{order.total_price}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    {/* Customer Info */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">👤 Customer</h5>
                        </div>
                        <div className="card-body">
                            <p className="mb-1"><strong>{order.user?.name}</strong></p>
                            <p className="mb-0 text-muted">{order.user?.email}</p>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">📦 Shipping Address</h5>
                        </div>
                        <div className="card-body">
                            {order.shipping_name ? (
                                <>
                                    <p className="mb-1"><strong>{order.shipping_name}</strong></p>
                                    <p className="mb-1 text-muted">{order.shipping_address}</p>
                                    <p className="mb-1 text-muted">
                                        {order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}
                                    </p>
                                    <p className="mb-0">📞 {order.shipping_phone}</p>
                                </>
                            ) : (
                                <p className="text-muted mb-0">No shipping address provided</p>
                            )}
                        </div>
                    </div>

                    {/* Update Status */}
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">⚙️ Update Status</h5>
                        </div>
                        <div className="card-body">
                            <select
                                className="form-select mb-3"
                                value={order.status}
                                onChange={(e) => updateStatus(e.target.value)}
                                disabled={updating}
                            >
                                <option value="pending">Pending</option>
                                <option value="shipped">Shipped</option>
                                <option value="completed">Completed</option>
                            </select>
                            {updating && (
                                <div className="text-center">
                                    <div className="spinner-border spinner-border-sm" />
                                    <span className="ms-2">Updating...</span>
                                </div>
                            )}

                            {order.razorpay_payment_id && (
                                <div className="mt-3 pt-3 border-top">
                                    <small className="text-muted">
                                        <strong>Payment ID:</strong><br />
                                        {order.razorpay_payment_id}
                                    </small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
