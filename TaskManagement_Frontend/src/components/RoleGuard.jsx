import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleGuard({ allow = [], children }) {
  const { user, isAuthReady } = useAuth();

  if (!isAuthReady) return null; // auth hazır olmadan render yok
  if (!user) return <Navigate to="/admin/login" replace />;

  const role = (user.role || "").toLowerCase();
  const allowed = allow.map((r) => r.toLowerCase());
  if (!allowed.includes(role)) return <Navigate to="/" replace />;

  return children; // 🔑 mutlaka çocukları döndür
}
