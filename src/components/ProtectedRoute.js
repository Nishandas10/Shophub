import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <div className="text-center mt-5"><div className="spinner-border" /></div>;
    if (!user) return <Navigate to="/login" />;

    return children;
}

export function AdminRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <div className="text-center mt-5"><div className="spinner-border" /></div>;
    if (!user) return <Navigate to="/login" />;
    if (user.role !== 'admin') return <Navigate to="/" />;

    return children;
}

// CustomerRoute - blocks admin users from accessing customer pages
export function CustomerRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <div className="text-center mt-5"><div className="spinner-border" /></div>;
    if (!user) return <Navigate to="/login" />;
    if (user.role === 'admin') return <Navigate to="/admin" />;

    return children;
}

// PublicCustomerRoute - allows guests, blocks admin users
export function PublicCustomerRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <div className="text-center mt-5"><div className="spinner-border" /></div>;
    if (user?.role === 'admin') return <Navigate to="/admin" />;

    return children;
}

export function GuestRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <div className="text-center mt-5"><div className="spinner-border" /></div>;
    if (user?.role === 'admin') return <Navigate to="/admin" />;
    if (user) return <Navigate to="/" />;

    return children;
}
