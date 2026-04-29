import api from "../api/axiosConfig";

export const getCart = async () => {
  try {
    const { data } = await api.get("/api/cart");
    return data;
  } catch (error) {
    console.error("Failed to fetch cart", error);
    return [];
  }
};

export const addToCart = async (product) => {
  try {
    const { data } = await api.post("/api/cart/add", {
      productId: product._id || product.id,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail,
      quantity: 1,
    });
    alert(`${product.title} has been added to your cart!`);
    return data;
  } catch (error) {
    console.error("Failed to add to cart", error);
    throw new Error(error.response?.data?.message || "Please login to add items to cart.");
  }
};

export const updateQuantity = async (productId, action) => {
  try {
    const { data } = await api.put(`/api/cart/${productId}`, { action });
    return data;
  } catch (error) {
    console.error("Failed to update quantity", error);
    return [];
  }
};

export const removeFromCart = async (productId) => {
  try {
    const { data } = await api.delete(`/api/cart/${productId}`);
    return data;
  } catch (error) {
    console.error("Failed to remove from cart", error);
    return [];
  }
};

export const clearCart = async () => {
    try {
        const { data } = await api.delete("/api/cart");
        return data;
    } catch (error) {
        console.error("Failed to clear cart", error);
        return [];
    }
};