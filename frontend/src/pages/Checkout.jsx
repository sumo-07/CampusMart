import { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { createOrder, verifyRazorpayPayment } from "../utils/orderUtils";
import { loadRazorpayScript } from "../utils/loadRazorpay";
import { addAddress } from "../utils/addressUtils";
import { AuthContext } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import '../components/css/checkout.css';

export const Checkout = () => {
  const { cartItems: contextCartItems, loading: cartLoading, resetCartState } = useCart();

  // Address modes: 'new' or index number from user.addresses
  const [addressMode, setAddressMode] = useState("new");

  // Form State for new address
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Razorpay");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, setUser, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const buyNowItem = location.state?.buyNowItem;

  const cartItems = buyNowItem ? [buyNowItem] : contextCartItems;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login?redirect=/checkout", {
        replace: true,
        state: location.state,
      });
    }
  }, [user, authLoading, navigate, location.state]);

  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      setAddressMode("0"); // First address
    }
  }, [user]);

  if (authLoading || cartLoading) return <p style={{ textAlign: 'center', padding: '4rem' }}>Loading checkout...</p>;
  if (!user) return null;

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!user) {
      navigate("/login?redirect=/checkout", { state: location.state });
      return;
    }
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
        paymentMethod: paymentMethod,
      };

      const data = await createOrder(orderData);

      // Handle Razorpay Payment Flow
      if (paymentMethod === "Razorpay") {
        if (!data.razorpayOrder) {
          throw new Error("Failed to initialize Razorpay order from server.");
        }

        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          alert("Unable to load Razorpay SDK. Please check your internet connection.");
          setIsSubmitting(false);
          return;
        }

        const options = {
          key: data.keyId,
          amount: data.razorpayOrder.amount,
          currency: data.razorpayOrder.currency,
          name: "CampusMart",
          description: `Order #${data._id}`,
          order_id: data.razorpayOrder.id,
          prefill: {
            name: finalShippingAddress.fullName,
            email: user?.email || "",
            contact: finalShippingAddress.phone,
          },
          theme: {
            color: "#4f46e5",
          },
          handler: async function (response) {
            setIsSubmitting(true);
            try {
              await verifyRazorpayPayment({
                orderId: data._id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              if (!buyNowItem) {
                resetCartState();
              }
              queryClient.invalidateQueries({ queryKey: ["myOrders"] });
              queryClient.invalidateQueries({ queryKey: ["products"] });
              queryClient.invalidateQueries({ queryKey: ["product"] });
              queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
              navigate("/orders");
            } catch (err) {
              alert(err.response?.data?.message || "Payment verification failed. Please check your Orders page.");
              queryClient.invalidateQueries({ queryKey: ["myOrders"] });
              navigate("/orders");
            } finally {
              setIsSubmitting(false);
            }
          },
          modal: {
            ondismiss: function () {
              alert("Payment window was closed. Your order has been placed in 'Pending' state. You can complete the payment anytime from My Orders.");
              if (!buyNowItem) {
                resetCartState();
              }
              queryClient.invalidateQueries({ queryKey: ["myOrders"] });
              queryClient.invalidateQueries({ queryKey: ["products"] });
              queryClient.invalidateQueries({ queryKey: ["product"] });
              queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
              navigate("/orders");
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response) {
          alert(`Payment failed: ${response.error.description || "Payment was rejected."}`);
          queryClient.invalidateQueries({ queryKey: ["myOrders"] });
          navigate("/orders");
        });
        rzp.open();
        setIsSubmitting(false);
        return;
      }

      // COD Flow
      if (!buyNowItem) {
        resetCartState();
      }
      queryClient.invalidateQueries({ queryKey: ["myOrders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
      navigate("/orders");
    } catch (error) {
      alert(error.response?.data?.message || error.message || "Failed to place order.");
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
            <p>{item.quantity} × ₹{Number(item.price).toFixed(2)}</p>
            <p>₹{(Number(item.price) * item.quantity).toFixed(2)}</p>
          </div>
        ))}
        <hr />
        <h3>Total: ₹{Number(totalPrice).toFixed(2)}</h3>
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

      {/* Payment Method Configuration */}
      <div className="checkout-payment-section" style={{ marginTop: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#1e293b' }}>Select Payment Method</h2>

        {/* Razorpay Option */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px',
            border: paymentMethod === "Razorpay" ? '2px solid #4f46e5' : '1px solid #cbd5e1',
            borderRadius: '8px',
            background: paymentMethod === "Razorpay" ? '#eef2ff' : '#fff',
            cursor: 'pointer',
            marginBottom: '12px',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            type="radio"
            name="paymentMethod"
            value="Razorpay"
            checked={paymentMethod === "Razorpay"}
            onChange={() => setPaymentMethod("Razorpay")}
            style={{ accentColor: '#4f46e5', width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', color: '#1e293b', fontSize: '0.95rem' }}>
              💳 Online Payment via Razorpay
            </strong>
            <small style={{ color: '#64748b' }}>
              Instant & secure: UPI (GPay, PhonePe, Paytm), Debit/Credit Cards, NetBanking.
            </small>
          </div>
          <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
            Instant Active
          </span>
        </label>

        {/* COD Option */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px',
            border: paymentMethod === "COD" ? '2px solid #4f46e5' : '1px solid #cbd5e1',
            borderRadius: '8px',
            background: paymentMethod === "COD" ? '#eef2ff' : '#fff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            type="radio"
            name="paymentMethod"
            value="COD"
            checked={paymentMethod === "COD"}
            onChange={() => setPaymentMethod("COD")}
            style={{ accentColor: '#4f46e5', width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', color: '#1e293b', fontSize: '0.95rem' }}>💵 Cash on Delivery (COD)</strong>
            <small style={{ color: '#64748b' }}>Pay in cash upon physical delivery of your campus items.</small>
          </div>
          <span style={{ fontSize: '0.75rem', background: '#e2e8f0', color: '#475569', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
            Available
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="checkout-actions">
        <button onClick={() => navigate("/cart")} disabled={isSubmitting}>Back to Cart</button>
        <button onClick={handlePlaceOrder} disabled={isSubmitting} style={{ background: "#4f46e5" }}>
          {isSubmitting
            ? "Processing..."
            : paymentMethod === "Razorpay"
            ? `Pay ₹${Number(totalPrice).toFixed(2)} with Razorpay`
            : "Place Order (COD)"}
        </button>
      </div>
    </section>
  );
};