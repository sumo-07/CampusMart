import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { LoadingScreen } from "./UI/LoadingScreen";

export const AdminRequire = () => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <LoadingScreen
                badge="🔒 SECURITY CHECK"
                badgeColor="pink"
                title="VERIFYING ACCESS..."
                subtitle="Confirming administrative privileges and session integrity..."
                icon="🛡️"
                statusText="Authenticating credentials..."
            />
        );
    }

    if (user && user.isAdmin) {
        return <Outlet />;
    }

    return <Navigate to="/" replace />;
};
