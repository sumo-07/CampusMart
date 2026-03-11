import { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdDeleteOutline } from "react-icons/md";
import { AuthContext } from "../context/AuthContext";

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
            <section style={{ textAlign: 'center', padding: '4rem' }}>
                <h2>Please Login to view your cart</h2>
                <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Login</Link>
            </section>
        );
    }

    if (loading) return <p style={{ textAlign: 'center', padding: '4rem' }}>Loading cart...</p>;

    if (cartItems.length === 0) {
        return (
            <section style={{ textAlign: 'center', padding: '4rem' }}>
                <h2>Your cart is empty</h2>
                <Link to="/product" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Go to Products</Link>
            </section>
        );
    }

    return (
        <section className="cart-section">
            <h1>Your Cart</h1>

            {cartItems.map((item) => (
                <div key={item.productId} className="cart-item">
                    <img
                        src={item.thumbnail}
                        alt={item.title}
                        width="80"
                    />

                    <div className="cart-item-info">
                        <h3>{item.title}</h3>
                        <p>₹{item.price}</p>

                        <div className="cart-qty">
                            <button onClick={() => handleQuantity(item.productId, "dec")}>
                                −
                            </button>

                            <span>{item.quantity}</span>

                            <button onClick={() => handleQuantity(item.productId, "inc")}>
                                +
                            </button>

                            {/* Remove Button */}
                            <button
                                className="cart-remove-btn"
                                onClick={() => handleRemove(item.productId)}
                                aria-label="Remove item"
                            >
                                <MdDeleteOutline size={22} />
                            </button>
                        </div>

                        <p>
                            Item Total: ₹{(Math.round(item.price * item.quantity * 100) / 100).toFixed(2)}                        </p>
                    </div>


                </div>
            ))}

            <hr />

            <h2>Total Price: ₹{totalPrice.toFixed(2)}</h2>

            <button onClick={() => navigate("/checkout")}>
                Checkout
            </button>
        </section>
    );
};