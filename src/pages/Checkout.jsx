import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCartFromStorage, clearCart } from "../utils/cartUtils";
import '../components/css/checkout.css';

export const Checkout = () => {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const cart = getCartFromStorage();
    setCartItems(cart);
  }, []);

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }

    clearCart();
    alert("Order placed successfully!");
    navigate("/product");
  };

  if (cartItems.length === 0) {
    return (
      <section className="checkout-section">
        <h2>No items in checkout</h2>
        <button onClick={() => navigate("/product")}>
          Go to Products
        </button>
      </section>
    );
  }

  return (
    <section className="checkout-section">
      <h1>Checkout</h1>

      {/* Order Summary */}
      <div className="checkout-summary">
        <h2>Order Summary</h2>

        {cartItems.map((item) => (
          <div key={item.id} className="checkout-item">
            <p>{item.title}</p>
            <p>
              {item.quantity} × ₹{item.price}
            </p>
            <p>
              ₹{item.price * item.quantity}
            </p>
          </div>
        ))}

        <hr />

        <h3>Total: ₹{totalPrice}</h3>
      </div>

      {/* User Details (dummy) */}
      <div className="checkout-form">
        <h2>Delivery Details</h2>

        <input
          type="text"
          placeholder="Full Name"
        />

        <input
          type="text"
          placeholder="Address"
        />

        <input
          type="text"
          placeholder="City"
        />

        <input
          type="text"
          placeholder="Pincode"
        />

        <input
          type="text"
          placeholder="Phone Number"
        />
      </div>

      {/* Actions */}
      <div className="checkout-actions">
        <button onClick={() => navigate("/cart")}>
          Back to Cart
        </button>

        <button onClick={handlePlaceOrder}>
          Place Order
        </button>
      </div>
    </section>
  );
};