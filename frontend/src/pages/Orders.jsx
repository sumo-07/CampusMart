import { useEffect, useState, useContext } from "react";
import { getMyOrders } from "../utils/orderUtils";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import '../components/css/orders.css';

export const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, loading: authLoading } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        // Wait until AuthContext finishes checking token
        if (authLoading) return;

        if (!user) {
            navigate("/login");
            return;
        }

        const fetchOrders = async () => {
            try {
                const data = await getMyOrders();
                setOrders(data);
            } catch (error) {
                console.error("Failed to fetch orders", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user, authLoading, navigate]);

    if (authLoading || loading) {
        return <p className="loading-text">Loading orders...</p>;
    }

    return (
        <section className="orders-section">
            <h1 className="orders-title">My Orders</h1>

            {orders.length === 0 ? (
                <div className="orders-empty">
                    <p>You have no past orders.</p>
                    <button 
                        onClick={() => navigate("/product")}
                        className="start-shopping-btn"
                    >
                        Start Shopping
                    </button>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map((order) => (
                        <div key={order._id} className="order-card">
                            <div className="order-header">
                                <div className="order-header-block">
                                    <span className="order-label">Order Placed</span>
                                    <span className="order-value">{new Date(order.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="order-header-block">
                                    <span className="order-label">Total</span>
                                    <span className="order-value">₹{order.totalPrice.toFixed(2)}</span>
                                </div>
                                <div className="order-header-block">
                                    <span className="order-label">Ship To</span>
                                    <span className="order-value">{order.shippingAddress.fullName}</span>
                                </div>
                                <div className="order-header-block right-align">
                                    <span className="order-label">Order #</span>
                                    <span className="order-value" style={{fontSize: '0.85rem'}}>{order._id}</span>
                                </div>
                            </div>
                            
                            <div className="order-items">
                                {order.orderItems.map((item, index) => (
                                    <div key={index} className="order-item">
                                        <div className="item-image-wrapper">
                                            <img src={item.thumbnail} alt={item.title} />
                                        </div>
                                        <div className="item-details">
                                            <p 
                                                className="item-title" 
                                                onClick={() => navigate(`/product/${item.productId}`)}
                                            >
                                                {item.title}
                                            </p>
                                            <p className="item-meta">
                                                Qty: {item.quantity} | ₹{item.price} each
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};
