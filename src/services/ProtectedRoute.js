import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

const ProtectedRoute = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        // Simulate token check (handle async storage if needed)
        const token = localStorage.getItem("token");
        setIsAuthenticated(!!token); // Convert token existence to boolean
    }, []);

    if (isAuthenticated === null) {
        return <div>Loading...</div>; // Prevents flickering before token check
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/auth/login" replace />;
};

export default ProtectedRoute;
