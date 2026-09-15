import { useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdDeleteOutline } from "react-icons/md";
import { AuthContext } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

import "../components/css/cart.css";

export const Cart = () => {
    const { cartItems, loading, updateQuantity, removeFromCart, totalPrice, refreshCart, MAX_ITEM_QUANTITY } = useCart();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            refreshCart();
        }
    }, [user]);

    const handleQuantity = async (productId, type) => {
        if (type === "inc") {
            const currentItem = cartItems.find((i) => String(i.productId) === String(productId));
            if (currentItem && currentItem.quantity >= (MAX_ITEM_QUANTITY || 5)) {
                alert(`Maximum ${MAX_ITEM_QUANTITY || 5} units allowed per item`);
                return;
            }
        }
        try {
            await updateQuantity(productId, type);
        } catch (error) {
            alert(error.message);
        }
    };

    const handleRemove = async (productId) => {
        try {
            await removeFromCart(productId);
        } catch (error) {
            alert(error.message);
        }
    };

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

                            <button
                                onClick={() => handleQuantity(item.productId, "inc")}
                                disabled={item.quantity >= (MAX_ITEM_QUANTITY || 5)}
                                title={item.quantity >= (MAX_ITEM_QUANTITY || 5) ? `Maximum ${MAX_ITEM_QUANTITY || 5} units allowed per item` : "Increase quantity"}
                            >
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

            <button
                onClick={() => {
                    if (!user) {
                        navigate("/login?redirect=/checkout");
                        return;
                    }
                    navigate("/checkout");
                }}
            >
                Checkout
            </button>
        </section>
    );
};