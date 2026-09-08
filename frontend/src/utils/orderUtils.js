import api from "../api/axiosConfig";

export const createOrder = async (orderData) => {
    try {
        const { data } = await api.post("/api/orders", orderData);
        return data;
    } catch (error) {
        console.error("Error creating order:", error);
        throw error;
    }
};

export const getMyOrders = async () => {
    try {
        const { data } = await api.get("/api/orders/myorders");
        return data;
    } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;
    }
};

export const cancelOrder = async (orderId) => {
    try {
        const { data } = await api.put(`/api/orders/${orderId}/cancel`);
        return data;
    } catch (error) {
        console.error("Error cancelling order:", error);
        throw error;
    }
};

export const updateOrderStatus = async (orderId, status) => {
    try {
        const { data } = await api.put(`/api/orders/${orderId}/status`, { status });
        return data;
    } catch (error) {
        console.error("Error updating order status:", error);
        throw error;
    }
};

export const verifyRazorpayPayment = async (paymentDetails) => {
    try {
        const { data } = await api.post("/api/orders/razorpay/verify", paymentDetails);
        return data;
    } catch (error) {
        console.error("Error verifying Razorpay payment:", error);
        throw error;
    }
};

export const retryOrderPayment = async (orderId) => {
    try {
        const { data } = await api.post(`/api/orders/razorpay/retry/${orderId}`);
        return data;
    } catch (error) {
        console.error("Error retrying Razorpay payment:", error);
        throw error;
    }
};

// Backward compatibility helper for legacy/cached components
export const createRazorpayOrder = async (orderData) => {
    return createOrder({ ...orderData, paymentMethod: "Razorpay" });
};



