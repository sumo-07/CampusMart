import axios from "axios";

const api = axios.create({
  baseURL: "https://dummyjson.com",
});

/* Get all products */
export const getAllProducts = async () => {
  const response = await api.get("/products?limit=1000");
  return response.data.products;
};

/* Get single product by id */
export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  console.log('res= ', response);
  return response.data;
};

/* Get all categories */
export const getAllCategories = async () => {
  const response = await api.get("/products/categories");
  return response.data;
};

/* Get products by category */
export const getProductsByCategory = async (category) => {
  const response = await api.get(`/products/category/${category}`);
  return response.data.products;
};