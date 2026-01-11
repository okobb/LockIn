import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "./AuthContext";

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthContext();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the child route
  return <Outlet />;
};