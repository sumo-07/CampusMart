import axios from "axios";

// In production on the same Railway domain, default to "" (relative requests like /api/...)
// In local development, fall back to http://localhost:5000 if VITE_BASE_URL is not provided
const rawBaseUrl = import.meta.env.VITE_BASE_URL !== undefined
    ? import.meta.env.VITE_BASE_URL
    : (import.meta.env.PROD ? "" : "http://localhost:5000");

const api = axios.create({
    baseURL: rawBaseUrl.trim(),
    withCredentials: true,
});

export default api;
