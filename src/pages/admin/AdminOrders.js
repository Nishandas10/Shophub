import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [updating, setUpdating] = useState(null);

    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line
    }, [page, statusFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = { page };
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/admin/orders', { params });
            setOrders(res.data.data);
            setLastPage(res.data.last_page);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        setUpdating(orderId);
        try {
            const res = await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
            setOrders(prev => prev.map(o => o.id === orderId ? res.data : o));
        } catch (err) {
            alert('Failed to update status');
        } finally {
            setUpdating(null);
        }
    };

    const statusBadge = (status) => {
        const colors = { pending: 'warning', shipped: 'info', completed: 'success' };
        return <span className={`badge bg-${colors[status] || 'secondary'}`}>{status}</span>;
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border" /></div>;

    return (
        <div className="container mt-4">
            <h2 className="mb-4">Manage Orders</h2>

            <div className="mb-3">
                <div className="btn-group">
                    <button
                        className={`btn ${!statusFilter ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => { setStatusFilter(''); setPage(1); }}
                    >All</button>
                    <button
                        className={`btn ${statusFilter === 'pending' ? 'btn-warning' : 'btn-outline-warning'}`}
                        onClick={() => { setStatusFilter('pending'); setPage(1); }}
                    >Pending</button>
                    <button
                        className={`btn ${statusFilter === 'shipped' ? 'btn-info' : 'btn-outline-info'}`}
                        onClick={() => { setStatusFilter('shipped'); setPage(1); }}
                    >Shipped</button>
                    <button
                        className={`btn ${statusFilter === 'completed' ? 'btn-success' : 'btn-outline-success'}`}
                        onClick={() => { setStatusFilter('completed'); setPage(1); }}
                    >Completed</button>
                </div>
            </div>

            {orders.length === 0 ? (
                <p className="text-muted">No orders found.</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th>Order #</th>
                                <th>Customer</th>
                                <th>Shipping To</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id}>
                                    <td>
                                        <Link to={`/admin/orders/${order.id}`}>#{order.id}</Link>
                                    </td>
                                    <td>
                                        {order.user?.name}
                                        <br />
                                        <small className="text-muted">{order.user?.email}</small>
                                    </td>
                                    <td>
                                        {order.shipping_name ? (
                                            <div style={{ maxWidth: '200px' }}>
                                                <strong className="small">{order.shipping_name}</strong>
                                                <br />
                                                <small className="text-muted">
                                                    {order.shipping_city}, {order.shipping_pincode}
                                                </small>
                                                <br />
                                                <small className="text-muted">📞 {order.shipping_phone}</small>
                                            </div>
                                        ) : (
                                            <span className="text-muted small">-</span>
                                        )}
                                    </td>
                                    <td>{order.items?.length || 0}</td>
                                    <td className="fw-bold">₹{order.total_price}</td>
                                    <td>{statusBadge(order.status)}</td>
                                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <select
                                            className="form-select form-select-sm"
                                            value={order.status}
                                            onChange={(e) => updateStatus(order.id, e.target.value)}
                                            disabled={updating === order.id}
                                            style={{ width: '130px' }}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {lastPage > 1 && (
                <nav>
                    <ul className="pagination justify-content-center">
                        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setPage(p => p - 1)}>Previous</button>
                        </li>
                        {Array.from({ length: lastPage }, (_, i) => i + 1).map(p => (
                            <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                                <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                            </li>
                        ))}
                        <li className={`page-item ${page === lastPage ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setPage(p => p + 1)}>Next</button>
                        </li>
                    </ul>
                </nav>
            )}
        </div>
    );
}
