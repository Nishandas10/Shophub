import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function ProductList() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [searchParams, setSearchParams] = useSearchParams();
    const [addingToCart, setAddingToCart] = useState(null);
    const { user } = useAuth();
    const { addToCart } = useCart();
    const navigate = useNavigate();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'created_at');
    const [sortDir, setSortDir] = useState(searchParams.get('sort_dir') || 'desc');
    const page = parseInt(searchParams.get('page') || '1');

    useEffect(() => {
        api.get('/products/categories').then(res => setCategories(res.data));
    }, []);

    useEffect(() => {
        fetchProducts();
        // eslint-disable-next-line
    }, [searchParams]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                per_page: 12,
                ...(search && { search }),
                ...(category && { category }),
                sort_by: sortBy,
                sort_dir: sortDir,
            };
            const res = await api.get('/products', { params });
            setProducts(res.data.data);
            setPagination({
                current: res.data.current_page,
                last: res.data.last_page,
                total: res.data.total,
            });
        } catch (e) {
            console.error('Failed to fetch products', e);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = (e) => {
        e.preventDefault();
        const params = {};
        if (search) params.search = search;
        if (category) params.category = category;
        params.sort_by = sortBy;
        params.sort_dir = sortDir;
        params.page = '1';
        setSearchParams(params);
    };

    const goToPage = (p) => {
        const params = Object.fromEntries(searchParams.entries());
        params.page = String(p);
        setSearchParams(params);
    };

    const clearFilters = () => {
        setSearch('');
        setCategory('');
        setSortBy('created_at');
        setSortDir('desc');
        setSearchParams({});
    };

    const handleAddToCart = async (productId) => {
        if (!user) {
            navigate('/login');
            return;
        }
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
        return `https://picsum.photos/seed/${encodeURIComponent(product.category)}/400/300`;
    };

    return (
        <div className="bg-light min-vh-100">
            <div className="container py-4">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-1">
                            {category ? category : 'All Products'}
                        </h2>
                        <p className="text-muted mb-0">
                            {!loading && `${pagination.total || 0} products available`}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body">
                        <form onSubmit={applyFilters}>
                            <div className="row g-3 align-items-end">
                                <div className="col-md-4">
                                    <label className="form-label small text-muted">Search Products</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-white border-end-0">🔍</span>
                                        <input
                                            type="text"
                                            className="form-control border-start-0"
                                            placeholder="Search by name..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small text-muted">Category</label>
                                    <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                                        <option value="">All Categories</option>
                                        {categories.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small text-muted">Sort By</label>
                                <select
                                    className="form-select"
                                    value={`${sortBy}:${sortDir}`}
                                    onChange={(e) => {
                                        const [by, dir] = e.target.value.split(':');
                                        setSortBy(by);
                                        setSortDir(dir);
                                    }}
                                >
                                    <option value="created_at:desc">Newest First</option>
                                    <option value="created_at:asc">Oldest First</option>
                                    <option value="price:asc">Price: Low to High</option>
                                    <option value="price:desc">Price: High to Low</option>
                                    <option value="name:asc">Name: A–Z</option>
                                    <option value="name:desc">Name: Z–A</option>
                                </select>
                                </div>
                                <div className="col-md-2 d-flex gap-2">
                                    <button type="submit" className="btn btn-primary flex-grow-1">
                                        Apply
                                    </button>
                                    <button type="button" className="btn btn-outline-secondary" onClick={clearFilters}>
                                        ✕
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" />
                        <p className="text-muted mt-2">Loading products...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-5">
                        <div className="fs-1 mb-3">🔍</div>
                        <h5 className="text-muted">No products found</h5>
                        <p className="text-muted">Try adjusting your search or filters</p>
                        <button className="btn btn-primary" onClick={clearFilters}>Clear Filters</button>
                    </div>
                ) : (
                    <>
                        <div className="row g-4">
                            {products.map(product => (
                                <div key={product.id} className="col-6 col-md-4 col-lg-3">
                                    <div className="card border-0 shadow-sm h-100 product-card" style={{ transition: 'all 0.2s ease' }}>
                                        <div className="position-relative overflow-hidden">
                                            <img
                                                src={getProductImage(product)}
                                                className="card-img-top"
                                                alt={product.name}
                                                style={{ height: '200px', objectFit: 'cover', transition: 'transform 0.3s' }}
                                                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                            />
                                            {product.stock < 10 && product.stock > 0 && (
                                                <span className="badge bg-warning text-dark position-absolute top-0 start-0 m-2">
                                                    Only {product.stock} left
                                                </span>
                                            )}
                                            {product.stock === 0 && (
                                                <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center">
                                                    <span className="badge bg-danger fs-6">Out of Stock</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="card-body d-flex flex-column">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <span className="badge bg-light text-dark small">{product.category}</span>
                                                <span className="text-warning small">★ 4.5</span>
                                            </div>
                                            <h6 className="card-title mb-1 fw-semibold" style={{
                                                overflow: 'hidden',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                minHeight: '2.8em'
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
                                            <div className="mt-auto">
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <span className="h5 text-primary mb-0 fw-bold">₹{product.price}</span>
                                                    {product.stock > 0 && (
                                                        <small className="text-success">In Stock</small>
                                                    )}
                                                </div>
                                                <div className="d-grid gap-2">
                                                    <button
                                                        className="btn btn-primary"
                                                        onClick={() => handleAddToCart(product.id)}
                                                        disabled={addingToCart === product.id || product.stock === 0}
                                                    >
                                                        {addingToCart === product.id ? (
                                                            <span className="spinner-border spinner-border-sm me-1" />
                                                        ) : (
                                                            <span>🛒</span>
                                                        )}
                                                        {addingToCart === product.id ? ' Adding...' : ' Add to Cart'}
                                                    </button>
                                                    <Link to={`/products/${product.id}`} className="btn btn-outline-secondary btn-sm">
                                                        View Details
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.last > 1 && (
                            <nav className="mt-5">
                                <ul className="pagination justify-content-center">
                                    <li className={`page-item ${pagination.current === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => goToPage(pagination.current - 1)}>
                                            ← Previous
                                        </button>
                                    </li>
                                    {Array.from({ length: Math.min(pagination.last, 5) }, (_, i) => {
                                        let pageNum;
                                        if (pagination.last <= 5) {
                                            pageNum = i + 1;
                                        } else if (pagination.current <= 3) {
                                            pageNum = i + 1;
                                        } else if (pagination.current >= pagination.last - 2) {
                                            pageNum = pagination.last - 4 + i;
                                        } else {
                                            pageNum = pagination.current - 2 + i;
                                        }
                                        return (
                                            <li key={pageNum} className={`page-item ${pageNum === pagination.current ? 'active' : ''}`}>
                                                <button className="page-link" onClick={() => goToPage(pageNum)}>{pageNum}</button>
                                            </li>
                                        );
                                    })}
                                    <li className={`page-item ${pagination.current === pagination.last ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => goToPage(pagination.current + 1)}>
                                            Next →
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
