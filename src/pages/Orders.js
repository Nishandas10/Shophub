import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line
    }, [page]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/orders', { params: { page } });
            setOrders(res.data.data);
            setLastPage(res.data.last_page);
        } catch (e) {
            console.error('Failed to fetch orders', e);
        } finally {
            setLoading(false);
        }
    };

    const statusBadge = (status) => {
        const colors = { pending: 'warning', shipped: 'info', completed: 'success' };
        return <span className={`badge bg-${colors[status] || 'secondary'}`}>{status}</span>;
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border" /></div>;

    return (
        <div className="container mt-4">
            <h2 className="mb-4">My Orders</h2>

            {orders.length === 0 ? (
                <div className="text-center py-5">
                    <h5 className="text-muted">No orders yet</h5>
                    <Link to="/products" className="btn btn-primary mt-3">Start Shopping</Link>
                </div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Date</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id}>
                                        <td>#{order.id}</td>
                                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td>{order.items?.length || 0} items</td>
                                        <td className="fw-bold">₹{order.total_price}</td>
                                        <td>{statusBadge(order.status)}</td>
                                        <td>
                                            <Link to={`/orders/${order.id}`} className="btn btn-sm btn-outline-primary">
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

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
                </>
            )}
        </div>
    );
}
