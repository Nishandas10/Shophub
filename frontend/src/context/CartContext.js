import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const fetchCart = useCallback(async () => {
        if (!user) {
            setItems([]);
            setTotal(0);
            return;
        }
        setLoading(true);
        try {
            const res = await api.get('/cart');
            setItems(res.data.items);
            setTotal(res.data.total);
        } catch (e) {
            console.error('Failed to fetch cart', e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const addToCart = async (productId, quantity = 1) => {
        const res = await api.post('/cart', { product_id: productId, quantity });
        await fetchCart();
        return res.data;
    };

    const updateQuantity = async (cartId, quantity) => {
        await api.put(`/cart/${cartId}`, { quantity });
        await fetchCart();
    };

    const removeItem = async (cartId) => {
        await api.delete(`/cart/${cartId}`);
        await fetchCart();
    };

    const clearCart = async () => {
        await api.delete('/cart');
        setItems([]);
        setTotal(0);
    };

    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            items, total, loading, cartCount,
            fetchCart, addToCart, updateQuantity, removeItem, clearCart
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
}
