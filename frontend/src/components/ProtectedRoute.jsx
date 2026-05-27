import { Navigate } from "react-router-dom";

// Checks localStorage for a valid token + matching role.
// No token → redirect to /login
// Wrong role → redirect to /login (or / for non-admin)
export default function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role?.toLowerCase().replace(/\s+/g, "_");

  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}