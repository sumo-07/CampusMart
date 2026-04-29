import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export const AdminRequire = () => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <p>Loading...</p>;

    if (user && user.isAdmin) {
        return <Outlet />;
    }

    return <Navigate to="/" replace />;
};
