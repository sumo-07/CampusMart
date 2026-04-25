import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getCart, clearCart } from "../utils/cartUtils";
import { AuthContext } from "../context/AuthContext";
import '../components/css/checkout.css';

export const Checkout = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      if (user) {
         setCartItems(await getCart());
      }
      setLoading(false);
    };
    fetchCart();
  }, [user]);

  if (loading) return <p style={{ textAlign: 'center', padding: '4rem' }}>Loading checkout...</p>;

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }

    await clearCart();
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
          <div key={item.productId} className="checkout-item">
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

        <h3>Total: ₹{totalPrice.toFixed(2)}</h3>
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