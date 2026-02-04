import { Navigate, Outlet } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "./AuthProvider";

export default function RequireAdmin() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "60vh" }}>
        <Spin />
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;

  return <Outlet />;
}
