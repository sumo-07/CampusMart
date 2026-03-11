import { createContext, useState, useEffect } from "react";
import api from "../api/axiosConfig";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem("token");
            if (token) {
                try {
                    const { data } = await api.get("/api/auth/profile");
                    setUser(data);
                } catch (error) {
                    console.error("Token invalid or expired", error);
                    localStorage.removeItem("token");
                }
            }
            setLoading(false);
        };

        fetchUser();
    }, []);

    const login = (userData, token) => {
        localStorage.setItem("token", token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
