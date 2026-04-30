import { useEffect, useState, useContext } from "react";
import { getMyOrders } from "../utils/orderUtils";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
        return (
            <div className="loading-container">
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="loading-text"
                >
                    Retrieving your order history...
                </motion.p>
            </div>
        );
    }

    const containerVariants = {
        initial: { opacity: 0 },
        animate: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
            }
        }
    };

    const cardVariants = {
        initial: { opacity: 0, x: -10 },
        animate: { opacity: 1, x: 0 }
    };

    return (
        <section className="orders-section">
            <motion.h1 
                variants={{ initial: { opacity: 0, y: -15 }, animate: { opacity: 1, y: 0 } }}
                className="orders-title"
            >
                My Orders
            </motion.h1>

            {orders.length === 0 ? (
                <motion.div 
                    className="orders-empty"
                    variants={{ initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 } }}
                >
                    <p>You have no past orders.</p>
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate("/product")}
                        className="start-shopping-btn"
                    >
                        Start Shopping
                    </motion.button>
                </motion.div>
            ) : (
                <motion.div 
                    className="orders-list"
                    variants={containerVariants}
                >
                    {orders.map((order) => (
                        <motion.div 
                            key={order._id} 
                            className="order-card"
                            variants={cardVariants}
                            whileHover={{ y: -5 }}
                        >
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
                                            <motion.p 
                                                className="item-title" 
                                                whileHover={{ color: "#0984e3", x: 3 }}
                                                onClick={() => navigate(`/product/${item.productId}`)}
                                            >
                                                {item.title}
                                            </motion.p>
                                            <p className="item-meta">
                                                Qty: {item.quantity} | ₹{item.price} each
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </section>
    );
};
