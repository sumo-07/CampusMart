import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axiosConfig";
import { AuthContext } from "./AuthContext";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch cart whenever user logs in or mounts
    useEffect(() => {
        const fetchCart = async () => {
            if (user) {
                try {
                    const { data } = await api.get("/api/cart");
                    setCartItems(Array.isArray(data) ? data : []);
                } catch (error) {
                    console.error("Failed to fetch cart:", error);
                    setCartItems([]);
                }
            } else {
                setCartItems([]);
            }
            setLoading(false);
        };

        fetchCart();
    }, [user]);

    // Helper to get the quantity of a specific product currently in cart
    const getItemQuantity = (productId) => {
        if (!productId) return 0;
        const item = cartItems.find((i) => String(i.productId) === String(productId));
        return item ? item.quantity : 0;
    };

    // Add new product or increment existing
    const addToCart = async (product, quantity = 1) => {
        const productId = product._id || product.id;
        try {
            const { data } = await api.post("/api/cart/add", {
                productId,
                title: product.title,
                price: product.price,
                thumbnail: product.thumbnail,
                quantity,
            });
            setCartItems(data);
            return data;
        } catch (error) {
            console.error("addToCart error:", error);
            throw new Error(error.response?.data?.message || "Please login to add items to cart.");
        }
    };

    // Update quantity ('inc' or 'dec')
    const updateQuantity = async (productId, action) => {
        const prevCart = [...cartItems];

        // Optimistic UI update for instant feedback
        setCartItems((prev) =>
            prev
                .map((item) => {
                    if (String(item.productId) === String(productId)) {
                        const nextQty = action === "inc" ? item.quantity + 1 : item.quantity - 1;
                        return { ...item, quantity: nextQty };
                    }
                    return item;
                })
                .filter((item) => item.quantity > 0)
        );

        try {
            const { data } = await api.put(`/api/cart/${productId}`, { action });
            setCartItems(data);
            return data;
        } catch (error) {
            console.error("updateQuantity error:", error);
            // Revert on failure
            setCartItems(prevCart);
            throw new Error(error.response?.data?.message || "Failed to update cart quantity.");
        }
    };

    // Remove single item completely
    const removeFromCart = async (productId) => {
        const prevCart = [...cartItems];
        setCartItems((prev) => prev.filter((item) => String(item.productId) !== String(productId)));

        try {
            const { data } = await api.delete(`/api/cart/${productId}`);
            setCartItems(data);
            return data;
        } catch (error) {
            console.error("removeFromCart error:", error);
            setCartItems(prevCart);
            throw new Error(error.response?.data?.message || "Failed to remove item.");
        }
    };

    // Clear whole cart on server and locally
    const clearCart = async () => {
        try {
            const { data } = await api.delete("/api/cart");
            setCartItems([]);
            return data;
        } catch (error) {
            console.error("clearCart error:", error);
            setCartItems([]);
        }
    };

    // Re-fetch cart from server to synchronize with backend state
    const refreshCart = async () => {
        if (user) {
            try {
                const { data } = await api.get("/api/cart");
                const list = Array.isArray(data) ? data : [];
                setCartItems(list);
                return list;
            } catch (error) {
                console.error("refreshCart error:", error);
                setCartItems([]);
            }
        } else {
            setCartItems([]);
        }
    };

    // Reset local cart state immediately (e.g. after order checkout)
    const resetCartState = () => {
        setCartItems([]);
    };

    // Total units in cart
    const totalCartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 0), 0);

    // Total cart price
    const totalPrice = cartItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 0), 0);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                loading,
                getItemQuantity,
                addToCart,
                updateQuantity,
                removeFromCart,
                clearCart,
                refreshCart,
                resetCartState,
                totalCartCount,
                totalPrice,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
