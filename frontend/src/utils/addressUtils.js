import api from "../api/axiosConfig";

export const addAddress = async (addressData) => {
    try {
        const { data } = await api.post("/api/auth/address", addressData);
        return data; // Returns the updated addresses array!
    } catch (error) {
        console.error("Error adding address:", error);
        throw error;
    }
};

export const setDefaultAddress = async (addressId) => {
    try {
        const { data } = await api.put(`/api/auth/address/default/${addressId}`);
        return data;
    } catch (error) {
        console.error("Error setting default address:", error);
        throw error;
    }
};
