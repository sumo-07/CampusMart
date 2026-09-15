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

export const updateAddress = async (addressId, addressData) => {
    try {
        const { data } = await api.put(`/api/auth/address/${addressId}`, addressData);
        return data; // Returns updated addresses array
    } catch (error) {
        console.error("Error updating address:", error);
        throw error;
    }
};

export const deleteAddress = async (addressId) => {
    try {
        const { data } = await api.delete(`/api/auth/address/${addressId}`);
        return data; // Returns updated addresses array
    } catch (error) {
        console.error("Error deleting address:", error);
        throw error;
    }
};
