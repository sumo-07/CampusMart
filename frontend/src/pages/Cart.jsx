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
    }, [user, refreshCart]);

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
            <section className="cart-empty-section">
                <div className="cart-empty-card">
                    <div className="neo-badge yellow" style={{ marginBottom: "1rem" }}>
                        🔒 AUTH REQUIRED
                    </div>
                    <h2>HOLD UP! GOTTA LOCK IN FIRST 🔑</h2>
                    <p>Please log in to your account to check out your bag.</p>
                    <Link to="/login?redirect=/cart" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
                        Lock In (Login)
                    </Link>
                </div>
            </section>
        );
    }

    if (loading) return (
        <section className="cart-empty-section">
            <div className="cart-empty-card">
                <h2>🍳 Loading your bag...</h2>
            </div>
        </section>
    );

    if (cartItems.length === 0) {
        return (
            <section className="cart-empty-section">
                <div className="cart-empty-card">
                    <div className="neo-badge pink" style={{ marginBottom: "1rem" }}>
                        💀 EMPTY BAG MOMENT
                    </div>
                    <h2>YOUR CART IS DRYER THAN THE SAHARA BESTIE</h2>
                    <p>Zero items copped. Your space and setup are begging for a glow-up.</p>
                    <Link to="/product" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
                        Go Cop Some Drip 🔥
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <section className="cart-section">
            <div className="cart-header-row">
                <div>
                    <div className="neo-badge yellow">🛍️ BAG CHECK</div>
                    <h1 className="cart-main-title">YOUR BAG</h1>
                </div>
                <span className="cart-items-count-badge">
                    {cartItems.length} {cartItems.length === 1 ? 'ITEM' : 'ITEMS'}
                </span>
            </div>

            <div className="cart-items-list">
                {cartItems.map((item) => (
                    <div key={item.productId} className="cart-item">
                        <div className="cart-item-img-wrap">
                            <img
                                src={item.thumbnail}
                                alt={item.title}
                            />
                        </div>

                        <div className="cart-item-info">
                            <h3 className="cart-item-title">{item.title}</h3>
                            <p className="cart-item-price">₹{Number(item.price).toFixed(2)} each</p>

                            <div className="cart-qty">
                                <button 
                                    onClick={() => handleQuantity(item.productId, "dec")}
                                    aria-label="Decrease quantity"
                                >
                                    −
                                </button>

                                <span className="cart-qty-num">{item.quantity}</span>

                                <button
                                    onClick={() => handleQuantity(item.productId, "inc")}
                                    disabled={item.quantity >= (MAX_ITEM_QUANTITY || 5)}
                                    title={item.quantity >= (MAX_ITEM_QUANTITY || 5) ? `Maximum ${MAX_ITEM_QUANTITY || 5} units allowed per item` : "Increase quantity"}
                                    aria-label="Increase quantity"
                                >
                                    +
                                </button>

                                {/* Remove Button */}
                                <button
                                    className="cart-remove-btn"
                                    onClick={() => handleRemove(item.productId)}
                                    aria-label="Remove item"
                                    title="Dump item"
                                >
                                    <MdDeleteOutline size={16} />
                                </button>
                            </div>

                            <p className="cart-item-total">
                                Subtotal: <strong>₹{(Math.round(item.price * item.quantity * 100) / 100).toFixed(2)}</strong>
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="cart-summary-box">
                <div className="cart-summary-row">
                    <span className="summary-label">BAG TOTAL:</span>
                    <span className="summary-total-price">₹{totalPrice.toFixed(2)}</span>
                </div>
                <p className="summary-free-shipping">✓ Free doorstep delivery included • No hidden fee scams</p>

                <button
                    className="cart-checkout-btn"
                    onClick={() => {
                        if (!user) {
                            navigate("/login?redirect=/checkout");
                            return;
                        }
                        navigate("/checkout");
                    }}
                >
                    SECURE THE BAG (CHECKOUT) ⚡
                </button>
            </div>
        </section>
    );
};