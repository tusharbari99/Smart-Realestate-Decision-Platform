import { Navigate, useLocation } from "react-router";

function getUser() {
  try {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

function AdminRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = getUser();

  const role = String(
    user?.role || user?.user_type || user?.account_type || "",
  ).toLowerCase();

  if (!token) {
    const redirect = encodeURIComponent(
      `${location.pathname}${location.search}`,
    );

    return <Navigate to={`/auth?redirect=${redirect}`} replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
