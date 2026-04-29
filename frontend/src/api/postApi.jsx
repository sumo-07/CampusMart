import api from "./axiosConfig";

/* Get all products */
export const getAllProducts = async () => {
  const response = await api.get("/api/products");
  return response.data.products;
};

/* Get single product by id */
export const getProductById = async (id) => {
  const response = await api.get(`/api/products/${id}`);
  return response.data;
};

/* Get all categories */
export const getAllCategories = async () => {
  const response = await api.get("/api/products/categories");
  return response.data;
};

/* Get products by category */
export const getProductsByCategory = async (category) => {
  const response = await api.get(`/api/products/category/${category}`);
  return response.data.products;
};