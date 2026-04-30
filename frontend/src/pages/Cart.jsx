import { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdDeleteOutline } from "react-icons/md";
import { AuthContext } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

import {
    getCart,
    updateQuantity,
    removeFromCart,
} from "../utils/cartUtils";

import "../components/css/cart.css";

export const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCart = async () => {
            if (user) {
                const data = await getCart();
                setCartItems(data);
            }
            setLoading(false);
        };
        fetchCart();
    }, [user]);

    const handleQuantity = async (productId, type) => {
        const updatedCart = await updateQuantity(productId, type);
        setCartItems(updatedCart);
    };

    const handleRemove = async (productId) => {
        const updatedCart = await removeFromCart(productId);
        setCartItems(updatedCart);
    };

    const totalPrice = cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    if (!user) {
        return (
            <motion.section 
                variants={{ initial: { opacity: 0 }, animate: { opacity: 1 } }}
                style={{ textAlign: 'center', padding: '4rem' }}
            >
                <h2>Please Login to view your cart</h2>
                <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Login</Link>
            </motion.section>
        );
    }

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p>Gathering your selected items...</p>
        </div>
    );

    if (cartItems.length === 0) {
        return (
            <motion.section 
                variants={{ initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 } }}
                style={{ textAlign: 'center', padding: '4rem' }}
            >
                <h2>Your cart is empty</h2>
                <Link to="/product" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Go to Products</Link>
            </motion.section>
        );
    }

    return (
        <section className="cart-section">
            <motion.h1 
                variants={{ initial: { opacity: 0, x: -15 }, animate: { opacity: 1, x: 0 } }}
            >
                Your Cart
            </motion.h1>

            <AnimatePresence>
                {cartItems.map((item) => (
                    <motion.div 
                        key={item.productId} 
                        className="cart-item"
                        variants={{ initial: { opacity: 0, x: -15 }, animate: { opacity: 1, x: 0 } }}
                        exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
                        layout
                    >
                        <img
                            src={item.thumbnail}
                            alt={item.title}
                            width="80"
                        />

                        <div className="cart-item-info">
                            <h3>{item.title}</h3>
                            <p>₹{item.price}</p>

                            <div className="cart-qty">
                                <motion.button 
                                    whileTap={{ scale: 0.8 }}
                                    onClick={() => handleQuantity(item.productId, "dec")}
                                >
                                    −
                                </motion.button>

                                <span>{item.quantity}</span>

                                <motion.button 
                                    whileTap={{ scale: 0.8 }}
                                    onClick={() => handleQuantity(item.productId, "inc")}
                                >
                                    +
                                </motion.button>

                                {/* Remove Button */}
                                <motion.button
                                    className="cart-remove-btn"
                                    whileHover={{ color: "#ef4444", scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleRemove(item.productId)}
                                    aria-label="Remove item"
                                >
                                    <MdDeleteOutline size={22} />
                                </motion.button>
                            </div>

                            <p>
                                Item Total: ₹{(Math.round(item.price * item.quantity * 100) / 100).toFixed(2)}                        </p>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            <motion.div 
                className="cart-summary"
                variants={{ initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 } }}
                transition={{ delay: 0.1 }}
            >
                <hr />
                <h2>Total Price: ₹{totalPrice.toFixed(2)}</h2>

                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/checkout")}
                >
                    Checkout
                </motion.button>
            </motion.div>
        </section>
    );
};