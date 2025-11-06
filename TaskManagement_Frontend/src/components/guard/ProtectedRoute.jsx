import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { accessToken, isAuthReady } = useAuth();

  // LocalStorage -> Context hydrate olmadan karar verme
  if (!isAuthReady) return null;

  return accessToken ? children : <Navigate to="/login" replace />;
}
