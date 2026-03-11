import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdDeleteOutline } from "react-icons/md";

import {
    getCartFromStorage,
    updateQuantity,
    removeFromCart,
} from "../utils/cartUtils";

import "../components/css/cart.css";

export const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        setCartItems(getCartFromStorage());
    }, []);

    const handleQuantity = (id, type) => {
        const updatedCart = updateQuantity(id, type);
        setCartItems(updatedCart);
    };

    const handleRemove = (id) => {
        const updatedCart = removeFromCart(id);
        setCartItems(updatedCart);
    };

    const totalPrice = cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    if (cartItems.length === 0) {
        return (
            <section>
                <h2>Your cart is empty</h2>
                <Link to="/product">Go to Products</Link>
            </section>
        );
    }

    return (
        <section className="cart-section">
            <h1>Your Cart</h1>

            {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                    <img
                        src={item.thumbnail}
                        alt={item.title}
                        width="80"
                    />

                    <div className="cart-item-info">
                        <h3>{item.title}</h3>
                        <p>₹{item.price}</p>

                        <div className="cart-qty">
                            <button onClick={() => handleQuantity(item.id, "dec")}>
                                −
                            </button>

                            <span>{item.quantity}</span>

                            <button onClick={() => handleQuantity(item.id, "inc")}>
                                +
                            </button>

                            {/* Remove Button */}
                            <button
                                className="cart-remove-btn"
                                onClick={() => handleRemove(item.id)}
                                aria-label="Remove item"
                            >
                                <MdDeleteOutline size={22} />
                            </button>
                        </div>

                        <p>
                            Item Total: ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                    </div>


                </div>
            ))}

            <hr />

            <h2>Total Price: ₹{totalPrice}</h2>

            <button onClick={() => navigate("/checkout")}>
                Checkout
            </button>
        </section>
    );
};