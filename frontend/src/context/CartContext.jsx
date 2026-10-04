import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import api from "../api/axiosConfig";
import { AuthContext } from "./AuthContext";

export const MAX_ITEM_QUANTITY = 5;

// eslint-disable-next-line react-refresh/only-export-components
export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Track latest cart items in ref for debounce callbacks
    const latestCartRef = useRef(cartItems);
    latestCartRef.current = cartItems;

    // Map of active debounce timers per product ID: { [productId]: timeoutId }
    const debounceTimers = useRef({});

    // Clean up all pending debounce timers on unmount
    useEffect(() => {
        return () => {
            Object.values(debounceTimers.current).forEach((timer) => clearTimeout(timer));
        };
    }, []);

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

    // Add new product or increment existing (Instant Optimistic UI - 0ms lag)
    const addToCart = async (product, quantity = 1) => {
        const productId = String(product._id || product.id);
        const currentQty = getItemQuantity(productId);

        if (currentQty + quantity > MAX_ITEM_QUANTITY) {
            throw new Error(`Maximum ${MAX_ITEM_QUANTITY} units allowed per item (${currentQty} already in your cart).`);
        }

        // Cancel any pending debounce timer on this product
        if (debounceTimers.current[productId]) {
            clearTimeout(debounceTimers.current[productId]);
            delete debounceTimers.current[productId];
        }

        const prevCart = [...cartItems];

        // 1. Instant Optimistic UI update (0ms feedback)
        setCartItems((prev) => {
            const exists = prev.some((i) => String(i.productId) === productId);
            if (exists) {
                return prev.map((item) =>
                    String(item.productId) === productId
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [
                ...prev,
                {
                    productId,
                    title: product.title,
                    price: product.price,
                    thumbnail: product.thumbnail,
                    quantity,
                },
            ];
        });

        // 2. Synchronize with server in background
        try {
            const { data } = await api.post("/api/cart/add", {
                productId,
                title: product.title,
                price: product.price,
                thumbnail: product.thumbnail,
                quantity,
            });

            // Merge safely: only update if user hasn't made further changes
            setCartItems((current) => {
                const latestItem = current.find((i) => String(i.productId) === productId);
                const serverItem = data.find((i) => String(i.productId) === productId);
                if (!latestItem || !serverItem || latestItem.quantity === serverItem.quantity) {
                    return data;
                }
                return current;
            });
            return data;
        } catch (error) {
            console.error("addToCart error:", error);
            setCartItems(prevCart);
            throw new Error(error.response?.data?.message || "Please login to add items to cart.");
        }
    };

    // Update quantity with Instant Optimistic UI + Debounced Server Sync
    const updateQuantity = async (productId, action) => {
        const id = String(productId);
        const currentQty = getItemQuantity(id);

        if (action === "inc" && currentQty >= MAX_ITEM_QUANTITY) {
            throw new Error(`Maximum ${MAX_ITEM_QUANTITY} units allowed per item.`);
        }

        const nextQty = action === "inc" ? currentQty + 1 : currentQty - 1;

        // 1. Instant Optimistic UI update (0ms lag, smooth feedback)
        setCartItems((prev) =>
            prev
                .map((item) => {
                    if (String(item.productId) === id) {
                        return { ...item, quantity: nextQty };
                    }
                    return item;
                })
                .filter((item) => item.quantity > 0)
        );

        // 2. Clear any pending debounce timer for this product
        if (debounceTimers.current[id]) {
            clearTimeout(debounceTimers.current[id]);
        }

        // 3. Debounce network sync by 250ms: batches rapid clicks into 1 single idempotent request
        debounceTimers.current[id] = setTimeout(async () => {
            try {
                // Find latest intended quantity for this product from ref
                const item = latestCartRef.current.find((i) => String(i.productId) === id);
                const targetQty = item ? item.quantity : 0;

                let responseData;
                if (targetQty <= 0) {
                    const { data } = await api.delete(`/api/cart/${id}`);
                    responseData = data;
                } else {
                    const { data } = await api.put(`/api/cart/${id}`, { quantity: targetQty, action });
                    responseData = data;
                }

                // Synchronize without overwriting newer clicks that occurred during network flight
                setCartItems((current) => {
                    const latest = current.find((i) => String(i.productId) === id);
                    if (!latest || latest.quantity === targetQty) {
                        return responseData;
                    }
                    return current;
                });
            } catch (error) {
                console.error("updateQuantity sync error:", error);
                refreshCart();
            } finally {
                delete debounceTimers.current[id];
            }
        }, 250);
    };

    // Remove single item completely (Instant Optimistic Removal)
    const removeFromCart = async (productId) => {
        const id = String(productId);
        if (debounceTimers.current[id]) {
            clearTimeout(debounceTimers.current[id]);
            delete debounceTimers.current[id];
        }

        const prevCart = [...cartItems];
        setCartItems((prev) => prev.filter((item) => String(item.productId) !== id));

        try {
            const { data } = await api.delete(`/api/cart/${id}`);
            setCartItems(data);
            return data;
        } catch (error) {
            console.error("removeFromCart error:", error);
            setCartItems(prevCart);
            throw new Error(error.response?.data?.message || "Failed to remove item.");
        }
    };

    // Clear whole cart on server and locally (Instant Optimistic Wipe)
    const clearCart = async () => {
        // Clear all pending debounce timers
        Object.values(debounceTimers.current).forEach((timer) => clearTimeout(timer));
        debounceTimers.current = {};

        const prevCart = [...cartItems];
        setCartItems([]); // Instant 0ms feedback

        try {
            const { data } = await api.delete("/api/cart");
            return data;
        } catch (error) {
            console.error("clearCart error:", error);
            setCartItems(prevCart);
        }
    };

    // Re-fetch cart from server to synchronize with backend state
    const refreshCart = useCallback(async () => {
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
    }, [user]);

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
                MAX_ITEM_QUANTITY,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
