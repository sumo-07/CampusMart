import { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCart } from "../utils/cartUtils";
import { createOrder } from "../utils/orderUtils";
import { addAddress } from "../utils/addressUtils";
import { AuthContext } from "../context/AuthContext";
import '../components/css/checkout.css';

export const Checkout = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Address modes: 'new' or index number from user.addresses
  const [addressMode, setAddressMode] = useState("new"); 

  // Form State for new address
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const buyNowItem = location.state?.buyNowItem;

  useEffect(() => {
    const fetchCart = async () => {
      if (user) {
         if (buyNowItem) {
             setCartItems([buyNowItem]);
         } else {
             setCartItems(await getCart());
         }
         // Pre-select Default address if exists
         if (user.addresses && user.addresses.length > 0) {
            setAddressMode("0"); // First address
         }
      }
      setLoading(false);
    };
    fetchCart();
  }, [user]);

  if (loading) return <p style={{ textAlign: 'center', padding: '4rem' }}>Loading checkout...</p>;

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }

    let finalShippingAddress = null;

    if (addressMode === "new") {
        if (!fullName || !address || !city || !pincode || !phone) {
          alert("Please fill in all delivery details.");
          return;
        }

        // Basic Validations
        if (!/^\d{10}$/.test(phone)) {
            alert("Please enter a valid 10-digit mobile number.");
            return;
        }
        if (!/^\d{5,6}$/.test(pincode)) {
            alert("Please enter a valid numeric pincode (5-6 digits).");
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Add Address to Backend Profile
            const newAddressPayload = { fullName, address, city, pincode, phone };
            const updatedAddresses = await addAddress(newAddressPayload);
            
            // 2. Update Global Context so Header updates instantly
            setUser((prev) => ({ ...prev, addresses: updatedAddresses }));

            finalShippingAddress = newAddressPayload;
        } catch (error) {
            alert(error.response?.data?.message || "Failed to save new address.");
            setIsSubmitting(false);
            return;
        }
    } else {
        // Use existing selected address
        finalShippingAddress = user.addresses[parseInt(addressMode)];
        setIsSubmitting(true);
    }

    // Place Order
    try {
      const orderData = {
        orderItems: cartItems,
        shippingAddress: finalShippingAddress,
        totalPrice: totalPrice,
        isBuyNow: !!buyNowItem,
      };

      await createOrder(orderData);
      navigate("/orders");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <section className="checkout-section">
        <h2>No items in checkout</h2>
        <button onClick={() => navigate("/product")}>Go to Products</button>
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
            <p>{item.quantity} × ₹{item.price}</p>
            <p>₹{item.price * item.quantity}</p>
          </div>
        ))}
        <hr />
        <h3>Total: ₹{totalPrice.toFixed(2)}</h3>
      </div>

      {/* Delivery Configuration */}
      <div className="checkout-form" style={{ marginTop: '2rem' }}>
        <h2>Delivery Details</h2>

        {/* Address Selection Dropdown */}
        {user?.addresses && user.addresses.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Select Delivery Address:</label>
                <select 
                    value={addressMode} 
                    onChange={(e) => setAddressMode(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "1rem" }}
                >
                    {user.addresses.map((addr, idx) => (
                        <option key={idx} value={idx.toString()}>
                            {addr.fullName} - {addr.address}, {addr.city}
                        </option>
                    ))}
                    <option value="new">+ Add New Address</option>
                </select>
            </div>
        )}

        {/* New Address Form (Hidden if using existing) */}
        {addressMode === "new" && (
            <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: "1rem", marginBottom: "1rem", color: "#4f46e5" }}>Enter New Address</h3>
                <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                <input type="text" placeholder="Street Address" value={address} onChange={(e) => setAddress(e.target.value)} />
                <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                <input type="text" placeholder="Pincode (e.g. 110001)" value={pincode} onChange={(e) => setPincode(e.target.value)} />
                <input type="text" placeholder="10-digit Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
        )}
      </div>

      {/* Actions */}
      <div className="checkout-actions">
        <button onClick={() => navigate("/cart")} disabled={isSubmitting}>Back to Cart</button>
        <button onClick={handlePlaceOrder} disabled={isSubmitting} style={{ background: "#4f46e5" }}>
          {isSubmitting ? "Placing Order..." : "Place Order"}
        </button>
      </div>
    </section>
  );
};