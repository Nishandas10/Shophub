import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/dashboard')
            .then(res => setStats(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center mt-5"><div className="spinner-border" /></div>;
    if (!stats) return <div className="alert alert-danger">Failed to load dashboard</div>;

    return (
        <div className="container mt-4">
            <h2 className="mb-4">Admin Dashboard</h2>

            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <div className="card text-center bg-primary text-white">
                        <div className="card-body">
                            <h3>{stats.total_products}</h3>
                            <p className="mb-0">Products</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-center bg-success text-white">
                        <div className="card-body">
                            <h3>{stats.total_orders}</h3>
                            <p className="mb-0">Total Orders</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-center bg-info text-white">
                        <div className="card-body">
                            <h3>{stats.total_customers}</h3>
                            <p className="mb-0">Customers</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-center bg-warning text-dark">
                        <div className="card-body">
                            <h3>₹{parseFloat(stats.total_revenue || 0).toFixed(2)}</h3>
                            <p className="mb-0">Revenue</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <div className="card text-center border-warning">
                        <div className="card-body">
                            <h3 className="text-warning">{stats.pending_orders}</h3>
                            <p className="mb-0">Pending Orders</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between">
                            <h5 className="mb-0">Recent Orders</h5>
                            <Link to="/admin/orders" className="btn btn-sm btn-outline-primary">View All</Link>
                        </div>
                        <div className="card-body">
                            {stats.recent_orders?.length > 0 ? (
                                <table className="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Customer</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.recent_orders.map(order => (
                                            <tr key={order.id}>
                                                <td>{order.id}</td>
                                                <td>{order.user?.name}</td>
                                                <td>₹{order.total_price}</td>
                                                <td>
                                                    <span className={`badge bg-${order.status === 'pending' ? 'warning' : order.status === 'shipped' ? 'info' : 'success'}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-muted mb-0">No orders yet</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header"><h5 className="mb-0">Quick Links</h5></div>
                        <div className="card-body">
                            <div className="d-grid gap-2">
                                <Link to="/admin/products" className="btn btn-outline-primary">Manage Products</Link>
                                <Link to="/admin/orders" className="btn btn-outline-primary">Manage Orders</Link>
                                <Link to="/admin/products/create" className="btn btn-outline-success">Add New Product</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
