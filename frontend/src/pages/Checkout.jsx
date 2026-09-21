import { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { createOrder, verifyRazorpayPayment } from "../utils/orderUtils";
import { loadRazorpayScript } from "../utils/loadRazorpay";
import { AddressModal } from "../components/UI/AddressModal";
import { AuthContext } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
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
      <div className="checkout-delivery-section">
        <h2>Delivery Details</h2>

        {!selectedAddress ? (
          /* Empty state: No address found */
          <div className="checkout-no-address-box">
            <div className="no-address-icon-wrap">
              <span className="no-address-icon">📍</span>
            </div>
            <div className="no-address-info">
              <h3>No Delivery Address Found</h3>
              <p>You haven't added a delivery address yet. Please add an address to proceed with checkout.</p>
            </div>
            <button
              type="button"
              className="checkout-btn-add-address"
              onClick={() => {
                setModalInitialNew(true);
                setIsAddressModalOpen(true);
              }}
            >
              + Add Delivery Address
            </button>
          </div>
        ) : (
          /* Active Selected Address Card */
          <div className="checkout-address-card">
            <div className="checkout-address-header">
              <div className="checkout-recipient-info">
                <span className="recipient-name">{selectedAddress.fullName}</span>
                {selectedAddress.isDefault && <span className="default-badge">DEFAULT</span>}
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
                  Change / Select Address
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
                {selectedAddress.city}, {selectedAddress.pincode}
              </p>
              <p className="address-phone-line">
                <span>📞</span> Phone: <strong>+91 {selectedAddress.phone}</strong>
              </p>
            </div>

            {user?.addresses && user.addresses.length > 1 && (
              <div className="checkout-address-pills-row">
                <span className="pills-title">Deliver to:</span>
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

      {/* Address Modal Interface (Exact same as navbar) */}
      {user && (
        <AddressModal
          isOpen={isAddressModalOpen}
          onClose={() => setIsAddressModalOpen(false)}
          initialShowNew={modalInitialNew}
          onAddressSelected={(id) => setSelectedAddressId(id)}
        />
      )}

      {/* Payment Method Configuration */}
      <div className="checkout-payment-section">
        <h2>Select Payment Method</h2>

        {/* Razorpay Option */}
        <label className={`payment-method-card ${paymentMethod === "Razorpay" ? "selected" : ""}`}>
          <input
            type="radio"
            name="paymentMethod"
            value="Razorpay"
            checked={paymentMethod === "Razorpay"}
            onChange={() => setPaymentMethod("Razorpay")}
          />
          <div className="payment-method-info">
            <strong className="payment-method-title">
              💳 Online Payment via Razorpay
            </strong>
            <span className="payment-method-desc">
              Instant & secure: UPI (GPay, PhonePe, Paytm), Debit/Credit Cards, NetBanking.
            </span>
          </div>
          <span className="payment-method-badge instant">
            Instant Active
          </span>
        </label>

        {/* COD Option */}
        <label className={`payment-method-card ${paymentMethod === "COD" ? "selected" : ""}`}>
          <input
            type="radio"
            name="paymentMethod"
            value="COD"
            checked={paymentMethod === "COD"}
            onChange={() => setPaymentMethod("COD")}
          />
          <div className="payment-method-info">
            <strong className="payment-method-title">💵 Cash on Delivery (COD)</strong>
            <span className="payment-method-desc">Pay in cash upon physical delivery of your campus items.</span>
          </div>
          <span className="payment-method-badge cod">
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