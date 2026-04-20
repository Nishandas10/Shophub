import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        fetchProducts();
        // eslint-disable-next-line
    }, [page]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/products', { params: { page, per_page: 15 } });
            setProducts(res.data.data);
            setLastPage(res.data.last_page);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        setDeleting(id);
        try {
            await api.delete(`/admin/products/${id}`);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            alert('Failed to delete product');
        } finally {
            setDeleting(null);
        }
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border" /></div>;

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Manage Products</h2>
                <Link to="/admin/products/create" className="btn btn-success">+ Add Product</Link>
            </div>

            <div className="table-responsive">
                <table className="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id}>
                                <td>{product.id}</td>
                                <td>{product.name}</td>
                                <td><span className="badge bg-secondary">{product.category}</span></td>
                                <td>₹{product.price}</td>
                                <td>
                                    <span className={product.stock > 0 ? 'text-success' : 'text-danger'}>
                                        {product.stock}
                                    </span>
                                </td>
                                <td>
                                    <div className="btn-group btn-group-sm">
                                        <Link to={`/admin/products/${product.id}/edit`} className="btn btn-outline-primary">
                                            Edit
                                        </Link>
                                        <button
                                            className="btn btn-outline-danger"
                                            onClick={() => handleDelete(product.id)}
                                            disabled={deleting === product.id}
                                        >
                                            {deleting === product.id ? '...' : 'Delete'}
                                        </button>
                                    </div>
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
        </div>
    );
}
