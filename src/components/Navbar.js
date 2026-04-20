import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path ? 'active' : '';

    // Admin goes to /admin, everyone else goes to /
    const homeLink = user?.role === 'admin' ? '/admin' : '/';

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-white sticky-top shadow-sm">
            <div className="container">
                <Link className="navbar-brand d-flex align-items-center" to={homeLink}>
                    <span className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                          style={{ width: '36px', height: '36px', fontSize: '18px' }}>
                        🛍️
                    </span>
                    <span className="fw-bold text-dark">ShopHub</span>
                </Link>
                <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto">
                        {user?.role !== 'admin' && (
                            <>
                                <li className="nav-item">
                                    <Link className={`nav-link fw-medium ${isActive('/')}`} to="/">Home</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link fw-medium ${isActive('/products')}`} to="/products">Products</Link>
                                </li>
                            </>
                        )}
                        {user && user.role !== 'admin' && (
                            <li className="nav-item">
                                <Link className={`nav-link fw-medium ${isActive('/orders')}`} to="/orders">My Orders</Link>
                            </li>
                        )}
                        {user?.role === 'admin' && (
                            <>
                                <li className="nav-item">
                                    <Link className={`nav-link fw-medium ${isActive('/admin')}`} to="/admin">
                                        📊 Dashboard
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link fw-medium ${isActive('/admin/products')}`} to="/admin/products">
                                        📦 Products
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link fw-medium ${isActive('/admin/orders')}`} to="/admin/orders">
                                        📋 Orders
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>
                    <ul className="navbar-nav align-items-center">
                        {user && user.role !== 'admin' && (
                            <>
                                <li className="nav-item me-2">
                                    <Link className={`nav-link fw-medium ${isActive('/support')}`} to="/support">
                                        🎫 Support
                                    </Link>
                                </li>
                                <li className="nav-item me-2">
                                    <Link className={`nav-link fw-medium ${isActive('/ai-assistant')}`} to="/ai-assistant">
                                        🤖 AI Help
                                    </Link>
                                </li>
                                <li className="nav-item me-3">
                                    <Link className="nav-link position-relative" to="/cart">
                                        <span className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
                                            🛒 Cart
                                            {cartCount > 0 && (
                                                <span className="badge bg-danger rounded-pill">{cartCount}</span>
                                            )}
                                        </span>
                                    </Link>
                                </li>
                            </>
                        )}
                        {user ? (
                            <li className="nav-item dropdown">
                                <span className="nav-link dropdown-toggle d-flex align-items-center gap-2" role="button" data-bs-toggle="dropdown">
                                    <span className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                                          style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                                        {user.name.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="d-none d-md-inline fw-medium">{user.name}</span>
                                </span>
                                <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
                                    <li className="px-3 py-2">
                                        <div className="fw-semibold">{user.name}</div>
                                        <small className="text-muted">{user.email}</small>
                                        {user.role === 'admin' && (
                                            <span className="badge bg-primary ms-2">Admin</span>
                                        )}
                                    </li>
                                    <li><hr className="dropdown-divider" /></li>
                                    {user.role !== 'admin' && (
                                        <li>
                                            <Link className="dropdown-item" to="/profile">
                                                👤 My Profile
                                            </Link>
                                        </li>
                                    )}
                                    <li>
                                        <button className="dropdown-item text-danger" onClick={handleLogout}>
                                            🚪 Sign Out
                                        </button>
                                    </li>
                                </ul>
                            </li>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link fw-medium" to="/login">Sign In</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="btn btn-primary btn-sm ms-2" to="/register">Get Started</Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
}
