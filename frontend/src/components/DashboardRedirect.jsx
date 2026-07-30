import { Navigate } from "react-router";

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function DashboardRedirect() {
  const token = localStorage.getItem("token");
  const user = getSavedUser();

  if (!token) {
    return <Navigate to="/auth?redirect=/dashboard" replace />;
  }

  const role = String(
    user?.role ||
      user?.user_type ||
      user?.account_type ||
      "",
  ).toLowerCase();

  if (role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (["seller", "broker"].includes(role)) {
    return <Navigate to="/seller/dashboard" replace />;
  }

  if (role === "buyer") {
    return <Navigate to="/buyer/dashboard" replace />;
  }

  return <Navigate to="/" replace />;
}

export default DashboardRedirect;
