import { Navigate, useLocation } from "react-router";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token) {
    const redirectPath = `${location.pathname}${location.search}`;

    return (
      <Navigate
        to={`/auth?redirect=${encodeURIComponent(redirectPath)}`}
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;
