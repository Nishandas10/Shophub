import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';

export default function OrderDetail() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const justPlaced = location.state?.justPlaced;

    useEffect(() => {
        api.get(`/orders/${id}`)
            .then(res => setOrder(res.data))
            .catch(() => navigate('/orders'))
            .finally(() => setLoading(false));
    }, [id, navigate]);

    const statusBadge = (status) => {
        const colors = { pending: 'warning', shipped: 'info', completed: 'success' };
        return <span className={`badge bg-${colors[status] || 'secondary'} fs-6`}>{status}</span>;
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border" /></div>;
    if (!order) return null;

    return (
        <div className="container mt-4">
            <button className="btn btn-link mb-3" onClick={() => navigate('/orders')}>← Back to Orders</button>

            {justPlaced && (
                <div className="alert alert-success">
                    Order placed successfully! Thank you for your purchase.
                </div>
            )}

            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">Order #{order.id}</h4>
                    {statusBadge(order.status)}
                </div>
                <div className="card-body">
                    <div className="row mb-4">
                        <div className="col-md-6">
                            <strong>Date:</strong> {new Date(order.created_at).toLocaleString()}
                        </div>
                        <div className="col-md-6">
                            <strong>Total:</strong> <span className="text-primary fw-bold">₹{order.total_price}</span>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    {order.shipping_name && (
                        <div className="bg-light rounded p-3 mb-4">
                            <h6 className="mb-2">📦 Shipping Address</h6>
                            <p className="mb-1"><strong>{order.shipping_name}</strong></p>
                            <p className="mb-1 text-muted">{order.shipping_address}</p>
                            <p className="mb-1 text-muted">
                                {order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}
                            </p>
                            <p className="mb-0 text-muted">📞 {order.shipping_phone}</p>
                        </div>
                    )}

                    <h5>Items</h5>
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
    );
}
