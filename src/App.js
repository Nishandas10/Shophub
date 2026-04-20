import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import { AdminRoute, GuestRoute, CustomerRoute, PublicCustomerRoute } from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import AiAssistant from './pages/AiAssistant';
import Support from './pages/Support';
import SupportDetail from './pages/SupportDetail';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import ProductForm from './pages/admin/ProductForm';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Navbar />
          <Routes>
            {/* Public customer routes - guests OK, admin blocked */}
            <Route path="/" element={<PublicCustomerRoute><Home /></PublicCustomerRoute>} />
            <Route path="/products" element={<PublicCustomerRoute><ProductList /></PublicCustomerRoute>} />
            <Route path="/products/:id" element={<PublicCustomerRoute><ProductDetail /></PublicCustomerRoute>} />

            {/* Guest only routes */}
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

            {/* Customer only routes - must be logged in, admin blocked */}
            <Route path="/cart" element={<CustomerRoute><CartPage /></CustomerRoute>} />
            <Route path="/checkout" element={<CustomerRoute><Checkout /></CustomerRoute>} />
            <Route path="/orders" element={<CustomerRoute><Orders /></CustomerRoute>} />
            <Route path="/orders/:id" element={<CustomerRoute><OrderDetail /></CustomerRoute>} />
            <Route path="/profile" element={<CustomerRoute><Profile /></CustomerRoute>} />
            <Route path="/ai-assistant" element={<CustomerRoute><AiAssistant /></CustomerRoute>} />
            <Route path="/support" element={<CustomerRoute><Support /></CustomerRoute>} />
            <Route path="/support/:id" element={<CustomerRoute><SupportDetail /></CustomerRoute>} />

            {/* Admin only routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
            <Route path="/admin/products/create" element={<AdminRoute><ProductForm /></AdminRoute>} />
            <Route path="/admin/products/:id/edit" element={<AdminRoute><ProductForm /></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
            <Route path="/admin/orders/:id" element={<AdminRoute><AdminOrderDetail /></AdminRoute>} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
