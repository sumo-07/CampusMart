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
