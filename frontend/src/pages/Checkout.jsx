import { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { createOrder, verifyRazorpayPayment } from "../utils/orderUtils";
import { loadRazorpayScript } from "../utils/loadRazorpay";
import { AddressModal } from "../components/UI/AddressModal";
import { AuthContext } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { LoadingScreen } from "../components/UI/LoadingScreen";
import '../components/css/checkout.css';

export const Checkout = () => {
  const { cartItems: contextCartItems, loading: cartLoading, resetCartState } = useCart();

  // Address selection and modal state
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [modalInitialNew, setModalInitialNew] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("Razorpay");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, loading: authLoading } = useContext(AuthContext);
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

  // Keep selected address in sync with user's address list
  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      if (!selectedAddressId || !user.addresses.some(a => a._id === selectedAddressId)) {
        const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
        setSelectedAddressId(defaultAddr._id);
      }
    } else {
      setSelectedAddressId(null);
    }
  }, [user?.addresses, selectedAddressId]);

  const selectedAddress = (user?.addresses && user.addresses.length > 0)
    ? (user.addresses.find(a => a._id === selectedAddressId) || user.addresses.find(a => a.isDefault) || user.addresses[0])
    : null;

  if (authLoading || cartLoading) {
    return (
      <LoadingScreen
        badge="💳 SECURE CHECKOUT"
        badgeColor="green"
        title="PREPARING CHECKOUT..."
        subtitle="Setting up secure payment gateway and address profiles..."
        icon="⚡"
        statusText="Validating cart items & session..."
      />
    );
  }
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

    if (!selectedAddress) {
      alert("Please add a delivery address to proceed with your order.");
      setModalInitialNew(true);
      setIsAddressModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    const finalShippingAddress = {
      fullName: selectedAddress.fullName,
      address: selectedAddress.address,
      city: selectedAddress.city,
      pincode: selectedAddress.pincode,
      phone: selectedAddress.phone,
    };

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
          name: "Cartsy",
          description: `Order #${data._id}`,
          order_id: data.razorpayOrder.id,
          prefill: {
            name: finalShippingAddress.fullName,
            email: user?.email || "",
            contact: finalShippingAddress.phone,
          },
          theme: {
            color: "#FFE600",
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
      <section className="checkout-empty-section">
        <div className="checkout-empty-card">
          <div className="neo-badge pink" style={{ marginBottom: "1rem" }}>
            💀 EMPTY DROP
          </div>
          <h2>NO DROPS IN CHECKOUT BESTIE</h2>
          <p>Go bag some heat from the catalog first!</p>
          <button onClick={() => navigate("/product")} className="btn btn-primary" style={{ marginTop: "1.5rem" }}>
            Go to Drops 🔥
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout-section">
      <div className="checkout-header-banner">
        <div className="neo-badge yellow">⚡ FINAL STEP</div>
        <h1 className="checkout-main-title">SECURE THE BAG</h1>
        <p className="checkout-subtitle">Verify your drop spot and lock in payment. Zero delays, pure speed.</p>
      </div>

      <div className="checkout-main-grid">
        <div className="checkout-steps-col">
          {/* Delivery Configuration (Step 1) */}
          <div className="checkout-step-card checkout-delivery-section">
            <div className="checkout-section-title-wrap">
              <span className="checkout-badge-num">1</span>
              <h2>DELIVERY ADDRESS 📍</h2>
            </div>

            {!selectedAddress ? (
              /* Empty state: No address found */
              <div className="checkout-no-address-box">
                <div className="no-address-icon-wrap">
                  <span className="no-address-icon">📍</span>
                </div>
                <div className="no-address-info">
                  <h3>No Delivery Address Found</h3>
                  <p>Where are we sending the goods? Add your delivery address to proceed.</p>
                </div>
                <button
                  type="button"
                  className="checkout-btn-add-address"
                  onClick={() => {
                    setModalInitialNew(true);
                    setIsAddressModalOpen(true);
                  }}
                >
                  + Add Address 📍
                </button>
              </div>
            ) : (
              /* Active Selected Address Card */
              <div className="checkout-address-card">
                <div className="checkout-address-header">
                  <div className="checkout-recipient-info">
                    <span className="recipient-name">{selectedAddress.fullName}</span>
                    {selectedAddress.isDefault && <span className="default-badge">MAIN SPOT</span>}
                  </div>
                  <div className="checkout-address-actions">
                    <button
                      type="button"
                      className="checkout-address-action-btn"
                      onClick={() => {
                        setModalInitialNew(false);
                        setIsAddressModalOpen(true);
                      }}
                      title="Choose from saved addresses or edit"
                    >
                      Change Drop Spot
                    </button>
                    <button
                      type="button"
                      className="checkout-address-action-btn primary"
                      onClick={() => {
                        setModalInitialNew(true);
                        setIsAddressModalOpen(true);
                      }}
                      title="Add another delivery address"
                    >
                      + Add New
                    </button>
                  </div>
                </div>

                <div className="checkout-address-body">
                  <p className="address-line">
                    <span>📍</span> {selectedAddress.address}
                  </p>
                  <p className="address-city-line">
                    {selectedAddress.city}, PIN: {selectedAddress.pincode}
                  </p>
                  <p className="address-phone-line">
                    <span>📞</span> Contact: <strong>+91 {selectedAddress.phone}</strong>
                  </p>
                </div>

                {user?.addresses && user.addresses.length > 1 && (
                  <div className="checkout-address-pills-row">
                    <span className="pills-title">Quick Switch:</span>
                    <div className="pills-container">
                      {user.addresses.map((addr) => (
                        <button
                          key={addr._id}
                          type="button"
                          className={`address-quick-pill ${selectedAddress._id === addr._id ? "active" : ""}`}
                          onClick={() => setSelectedAddressId(addr._id)}
                        >
                          {addr.fullName} ({addr.city})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Bag Summary */}
          <div className="checkout-step-card checkout-summary-section">
            <div className="checkout-section-title-wrap">
              <span className="checkout-badge-num">2</span>
              <h2>BAG SUMMARY</h2>
            </div>

            <div className="checkout-items-list">
              {cartItems.map((item) => (
                <div key={item.productId} className="checkout-item">
                  <div className="checkout-item-left">
                    <div className="checkout-item-img-wrap">
                      <img
                        src={item.thumbnail || item.image || (Array.isArray(item.images) && item.images[0]) || "/logo.jpg"}
                        alt={item.title || "Product"}
                        className="checkout-item-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/logo.jpg";
                        }}
                      />
                    </div>
                    <div className="checkout-item-title-box">
                      <p className="item-name">{item.title}</p>
                      <span className="item-calc">{item.quantity} × ₹{Number(item.price).toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="item-final-price">₹{(Number(item.price) * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="checkout-total-row">
              <span className="total-label">BAG SUBTOTAL:</span>
              <span className="total-amount">₹{Number(totalPrice).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Step 3: Choose Payment Vibe & Place Order */}
        <aside className="checkout-sidebar-col">
          <div className="checkout-step-card checkout-payment-section">
            <div className="checkout-section-title-wrap">
              <span className="checkout-badge-num">3</span>
              <h2>CHOOSE PAYMENT VIBE</h2>
            </div>

            {/* Razorpay Option */}
            <label className={`payment-method-card ${paymentMethod === "Razorpay" ? "selected" : ""}`}>
              <div className="payment-method-radio-wrap">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Razorpay"
                  checked={paymentMethod === "Razorpay"}
                  onChange={() => setPaymentMethod("Razorpay")}
                />
              </div>
              <div className="payment-method-info">
                <div className="payment-method-header-row">
                  <strong className="payment-method-title">
                    ⚡ Razorpay Instant
                  </strong>
                  <span className="payment-method-badge instant">
                    RECOMMENDED 🚀
                  </span>
                </div>
                <p className="payment-method-subtext">UPI, GPay, PhonePe, Cards, NetBanking</p>
                <span className="payment-method-desc">
                  Zero wait, confirmed instantly. Pay using QR code, PhonePe, Paytm, or Card.
                </span>
              </div>
            </label>

            {/* COD Option */}
            <label className={`payment-method-card ${paymentMethod === "COD" ? "selected" : ""}`}>
              <div className="payment-method-radio-wrap">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                />
              </div>
              <div className="payment-method-info">
                <div className="payment-method-header-row">
                  <strong className="payment-method-title">
                    💵 Cash on Delivery
                  </strong>
                  <span className="payment-method-badge cod">
                    COD ACTIVE
                  </span>
                </div>
                <p className="payment-method-subtext">Doorstep Handoff</p>
                <span className="payment-method-desc">
                  Pay cash in hand when the courier arrives at your doorstep.
                </span>
              </div>
            </label>

            <div className="checkout-final-pay-row">
              <span className="final-pay-label">TOTAL TO PAY:</span>
              <span className="final-pay-amount">₹{Number(totalPrice).toFixed(2)}</span>
            </div>

            <div className="checkout-actions">
              <button 
                className="btn-submit-order" 
                onClick={handlePlaceOrder} 
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Cooking your order..."
                  : paymentMethod === "Razorpay"
                  ? `PAY ₹${Number(totalPrice).toFixed(2)} VIA RAZORPAY ⚡`
                  : "LOCK IN ORDER (COD) 📦"}
              </button>
              <button className="btn-back-cart" onClick={() => navigate("/cart")} disabled={isSubmitting}>
                ← Recheck Bag
              </button>
            </div>

            <div className="checkout-trust-badge">
              <span>🔒 256-Bit Encrypted & Verified</span>
              <small>Instant refunds on order failure • Zero risk</small>
            </div>
          </div>
        </aside>
      </div>

      {/* Address Modal Interface (Exact same as navbar) */}
      {user && (
        <AddressModal
          isOpen={isAddressModalOpen}
          onClose={() => setIsAddressModalOpen(false)}
          initialShowNew={modalInitialNew}
          onAddressSelected={(id) => setSelectedAddressId(id)}
        />
      )}
    </section>
  );
};